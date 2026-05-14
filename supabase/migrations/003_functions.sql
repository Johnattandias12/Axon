-- ============================================================
-- Migration 003 — Functions
-- ============================================================

-- ------------------------------------------------------------
-- reserve_lot: reserva N unidades de um lote para um pedido
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_lot(
  p_lot_id uuid,
  p_quantity int,
  p_order_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available int;
BEGIN
  -- Lock pessimista
  SELECT (quantity_total - quantity_sold - quantity_reserved)
    INTO v_available
    FROM public.ticket_lots
    WHERE id = p_lot_id
    FOR UPDATE;

  IF v_available IS NULL THEN
    RAISE EXCEPTION 'lote_nao_encontrado'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'estoque_insuficiente: disponível %, pedido %', v_available, p_quantity
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.ticket_lots
    SET quantity_reserved = quantity_reserved + p_quantity
    WHERE id = p_lot_id;
END;
$$;

-- ------------------------------------------------------------
-- release_lot: libera reserva (usado em cancel/expiração)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_lot(
  p_lot_id uuid,
  p_quantity int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ticket_lots
    SET quantity_reserved = GREATEST(quantity_reserved - p_quantity, 0)
    WHERE id = p_lot_id;
END;
$$;

-- ------------------------------------------------------------
-- generate_qr_hash: HMAC-SHA256 do ticket_id + event_id
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_qr_hash(
  p_ticket_id uuid,
  p_event_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret text;
  v_hmac text;
BEGIN
  v_secret := current_setting('app.qr_secret', true);
  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'QR_HMAC_SECRET não configurado (app.qr_secret)';
  END IF;

  v_hmac := encode(
    hmac(
      p_ticket_id::text || '|' || p_event_id::text,
      v_secret,
      'sha256'
    ),
    'hex'
  );

  RETURN 'AXN1.' || replace(p_ticket_id::text, '-', '') || '.' || substr(v_hmac, 1, 16);
END;
$$;

-- ------------------------------------------------------------
-- confirm_order: marca order paga, gera tickets, atualiza lotes
-- Chamada pelo webhook após confirmação do pagamento.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_order(
  p_order_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_item record;
  v_ticket_id uuid;
  v_qr text;
  v_holder jsonb;
  v_holders jsonb;
  v_holder_index int;
BEGIN
  -- Lock pedido
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'pedido_nao_encontrado';
  END IF;

  IF v_order.status <> 'pending' THEN
    -- idempotência
    RETURN;
  END IF;

  UPDATE public.orders
    SET status = 'paid', paid_at = now()
    WHERE id = p_order_id;

  -- Holders esperados em metadata.holders = [{ name, cpf, half_doc_type?, lot_id, position }, ...]
  v_holders := COALESCE(v_order.metadata -> 'holders', '[]'::jsonb);

  v_holder_index := 0;

  FOR v_item IN
    SELECT oi.*, tl.is_half_price, tl.event_id
      FROM public.order_items oi
      JOIN public.ticket_lots tl ON tl.id = oi.ticket_lot_id
      WHERE oi.order_id = p_order_id
  LOOP
    FOR i IN 1..v_item.quantity LOOP
      v_holder := v_holders -> v_holder_index;
      v_ticket_id := uuid_generate_v4();
      v_qr := public.generate_qr_hash(v_ticket_id, v_item.event_id);

      INSERT INTO public.tickets (
        id, order_id, ticket_lot_id, event_id,
        qr_hash, holder_name, holder_cpf,
        is_half_price, half_price_doc_type
      ) VALUES (
        v_ticket_id, p_order_id, v_item.ticket_lot_id, v_item.event_id,
        v_qr,
        COALESCE(v_holder ->> 'name', 'Titular'),
        COALESCE(v_holder ->> 'cpf', ''),
        v_item.is_half_price,
        v_holder ->> 'half_doc_type'
      );

      v_holder_index := v_holder_index + 1;
    END LOOP;

    -- Move reserva → vendido
    UPDATE public.ticket_lots
      SET quantity_reserved = GREATEST(quantity_reserved - v_item.quantity, 0),
          quantity_sold = quantity_sold + v_item.quantity
      WHERE id = v_item.ticket_lot_id;
  END LOOP;
END;
$$;

-- ------------------------------------------------------------
-- expire_pending_orders: cron (Supabase pg_cron)
-- Libera reservas vencidas e marca pedidos como expirados.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_pending_orders()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_item record;
  v_count int := 0;
BEGIN
  FOR v_order IN
    SELECT id FROM public.orders
      WHERE status = 'pending'
        AND reserved_until < now()
      FOR UPDATE SKIP LOCKED
  LOOP
    FOR v_item IN
      SELECT * FROM public.order_items WHERE order_id = v_order.id
    LOOP
      PERFORM public.release_lot(v_item.ticket_lot_id, v_item.quantity);
    END LOOP;

    UPDATE public.orders
      SET status = 'expired', cancelled_at = now()
      WHERE id = v_order.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ------------------------------------------------------------
-- validate_ticket: marca ingresso como usado se válido
-- Chamada pela Edge Function /validate-ticket.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_ticket(
  p_payload text,
  p_validator_id uuid,
  p_gate text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
  v_expected_qr text;
  v_id_part text;
  v_ticket_id uuid;
  v_result text;
BEGIN
  -- Parse: AXN1.<hex32>.<hmac16>
  IF p_payload !~ '^AXN1\.[a-f0-9]{32}\.[a-f0-9]{16}$' THEN
    INSERT INTO public.check_ins (event_id, validator_id, result, gate, payload_hash)
      VALUES (NULL, p_validator_id, 'invalid_hmac', p_gate, encode(sha256(p_payload::bytea), 'hex'));
    RETURN jsonb_build_object('result','invalid_hmac');
  END IF;

  v_id_part := split_part(p_payload, '.', 2);
  v_ticket_id := (substr(v_id_part,1,8) || '-' ||
                  substr(v_id_part,9,4) || '-' ||
                  substr(v_id_part,13,4) || '-' ||
                  substr(v_id_part,17,4) || '-' ||
                  substr(v_id_part,21,12))::uuid;

  SELECT * INTO v_ticket FROM public.tickets WHERE id = v_ticket_id FOR UPDATE;

  IF v_ticket.id IS NULL THEN
    INSERT INTO public.check_ins (event_id, validator_id, result, gate)
      VALUES (NULL, p_validator_id, 'not_found', p_gate);
    RETURN jsonb_build_object('result','not_found');
  END IF;

  -- Recalcula HMAC para confirmar
  v_expected_qr := public.generate_qr_hash(v_ticket.id, v_ticket.event_id);
  IF v_expected_qr <> p_payload THEN
    INSERT INTO public.check_ins (ticket_id, event_id, validator_id, result, gate)
      VALUES (v_ticket.id, v_ticket.event_id, p_validator_id, 'invalid_hmac', p_gate);
    RETURN jsonb_build_object('result','invalid_hmac');
  END IF;

  -- Confere se validator tem permissão
  IF NOT public.can_validate_event(v_ticket.event_id) THEN
    RAISE EXCEPTION 'sem_permissao' USING ERRCODE = '42501';
  END IF;

  -- Switch por status
  v_result := CASE v_ticket.status
    WHEN 'valid'     THEN 'valid'
    WHEN 'used'      THEN 'already_used'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'refunded'  THEN 'refunded'
    ELSE 'unknown'
  END;

  IF v_result = 'valid' THEN
    UPDATE public.tickets
      SET status = 'used',
          used_at = now(),
          used_by = p_validator_id,
          gate = p_gate
      WHERE id = v_ticket.id;
  END IF;

  INSERT INTO public.check_ins (ticket_id, event_id, validator_id, result, gate)
    VALUES (v_ticket.id, v_ticket.event_id, p_validator_id, v_result, p_gate);

  RETURN jsonb_build_object(
    'result', v_result,
    'holder_name', v_ticket.holder_name,
    'holder_cpf', CASE WHEN v_result = 'valid' THEN v_ticket.holder_cpf ELSE NULL END,
    'is_half_price', v_ticket.is_half_price,
    'used_at', v_ticket.used_at,
    'ticket_id', v_ticket.id
  );
END;
$$;

-- ------------------------------------------------------------
-- compute_organizer_balance: saldo do organizador
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.organizer_balance AS
SELECT
  o.id AS organizer_id,
  COALESCE(SUM(
    CASE
      WHEN ord.status = 'paid' AND ord.payment_method = 'pix' AND ord.paid_at < now() - INTERVAL '1 day'
        THEN ord.subtotal_cents - ord.service_fee_cents
      WHEN ord.status = 'paid' AND ord.payment_method = 'credit_card' AND ord.paid_at < now() - INTERVAL '30 days'
        THEN ord.subtotal_cents - ord.service_fee_cents
      ELSE 0
    END
  ), 0) AS available_cents,
  COALESCE(SUM(
    CASE
      WHEN ord.status = 'paid'
        AND (
          (ord.payment_method = 'pix' AND ord.paid_at >= now() - INTERVAL '1 day') OR
          (ord.payment_method = 'credit_card' AND ord.paid_at >= now() - INTERVAL '30 days')
        )
        THEN ord.subtotal_cents - ord.service_fee_cents
      ELSE 0
    END
  ), 0) AS pending_cents,
  COALESCE((SELECT SUM(amount_cents) FROM public.payouts p
            WHERE p.organizer_id = o.id AND p.status = 'paid'), 0) AS withdrawn_cents
FROM public.organizers o
LEFT JOIN public.events e ON e.organizer_id = o.id
LEFT JOIN public.orders ord ON ord.event_id = e.id
GROUP BY o.id;

-- ------------------------------------------------------------
-- validate_half_price_quota: 40% obrigatório
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_half_price_quota()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_total int;
  v_half int;
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status <> 'published') THEN
    SELECT
      COALESCE(SUM(quantity_total), 0),
      COALESCE(SUM(CASE WHEN is_half_price THEN quantity_total ELSE 0 END), 0)
      INTO v_total, v_half
      FROM public.ticket_lots
      WHERE event_id = NEW.id;

    IF v_total = 0 THEN
      RAISE EXCEPTION 'evento_sem_lotes';
    END IF;

    IF (v_half::numeric / v_total::numeric) < 0.40 THEN
      RAISE EXCEPTION 'meia_entrada_insuficiente: % de % (mínimo 40%%)', v_half, v_total;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_half_price
  BEFORE UPDATE OF status ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_half_price_quota();

-- ------------------------------------------------------------
-- pg_cron: rodar expire_pending_orders a cada minuto
-- (Ativar extensão no painel Supabase primeiro)
-- ------------------------------------------------------------
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('expire-orders', '* * * * *', 'SELECT public.expire_pending_orders();');
