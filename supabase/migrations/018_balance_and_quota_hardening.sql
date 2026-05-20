-- ============================================================
-- Migration 018 — Hardening pré-piloto
-- - Corrige view organizer_balance (subtrai saques)
-- - Trigger meia-entrada também em ticket_lots (não só em events)
-- - Cleanup: remove confirm_order (substituído pelo webhook em Node)
-- ============================================================

-- ------------------------------------------------------------
-- 1. organizer_balance: subtrair withdrawn de available
--    Antes a view devolvia available e withdrawn separados sem
--    fazer a conta. UI poderia mostrar saldo "fantasma" depois
--    de saques pagos. Agora available já é líquido.
-- ------------------------------------------------------------
DROP VIEW IF EXISTS public.organizer_balance;

CREATE VIEW public.organizer_balance AS
WITH gross AS (
  SELECT
    o.id AS organizer_id,
    COALESCE(SUM(
      CASE
        WHEN ord.status = 'paid' AND ord.payment_method = 'pix' AND ord.paid_at < now() - INTERVAL '1 day'
          THEN ord.subtotal_cents - ord.service_fee_cents
        WHEN ord.status = 'paid' AND ord.payment_method = 'credit_card' AND ord.paid_at < now() - INTERVAL '17 days'
          THEN ord.subtotal_cents - ord.service_fee_cents
        ELSE 0
      END
    ), 0) AS available_gross_cents,
    COALESCE(SUM(
      CASE
        WHEN ord.status = 'paid'
          AND (
            (ord.payment_method = 'pix' AND ord.paid_at >= now() - INTERVAL '1 day') OR
            (ord.payment_method = 'credit_card' AND ord.paid_at >= now() - INTERVAL '17 days')
          )
          THEN ord.subtotal_cents - ord.service_fee_cents
        ELSE 0
      END
    ), 0) AS pending_cents
  FROM public.organizers o
  LEFT JOIN public.events e ON e.organizer_id = o.id
  LEFT JOIN public.orders ord ON ord.event_id = e.id
  GROUP BY o.id
),
withdrawn AS (
  SELECT
    organizer_id,
    COALESCE(SUM(amount_cents), 0) AS withdrawn_cents
  FROM public.payouts
  WHERE status IN ('paid','processing')
  GROUP BY organizer_id
)
SELECT
  g.organizer_id,
  GREATEST(g.available_gross_cents - COALESCE(w.withdrawn_cents, 0), 0) AS available_cents,
  g.pending_cents,
  COALESCE(w.withdrawn_cents, 0) AS withdrawn_cents
FROM gross g
LEFT JOIN withdrawn w ON w.organizer_id = g.organizer_id;

-- ------------------------------------------------------------
-- 2. Trigger meia-entrada em ticket_lots
--    Antes a checagem só rodava ao publicar o evento. Depois de
--    publicado, organizer poderia inserir lote violando 40%.
--    Agora qualquer INSERT/UPDATE/DELETE em ticket_lots de evento
--    publicado é validado.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_half_price_quota_on_lot()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_total int;
  v_half int;
  v_status text;
  v_event_id uuid;
BEGIN
  v_event_id := COALESCE(NEW.event_id, OLD.event_id);

  SELECT status INTO v_status FROM public.events WHERE id = v_event_id;
  IF v_status <> 'published' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT
    COALESCE(SUM(quantity_total), 0),
    COALESCE(SUM(CASE WHEN is_half_price THEN quantity_total ELSE 0 END), 0)
    INTO v_total, v_half
    FROM public.ticket_lots
    WHERE event_id = v_event_id;

  IF v_total = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF (v_half::numeric / v_total::numeric) < 0.40 THEN
    RAISE EXCEPTION 'meia_entrada_insuficiente: % de % (mínimo 40%%)', v_half, v_total
      USING ERRCODE = 'P0001';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_half_price_lots ON public.ticket_lots;
CREATE CONSTRAINT TRIGGER trg_validate_half_price_lots
  AFTER INSERT OR UPDATE OR DELETE ON public.ticket_lots
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_half_price_quota_on_lot();

-- ------------------------------------------------------------
-- 3. confirm_order: marcar como deprecated (não dropamos, pois
--    pode ser referenciado por jobs antigos; só comentamos)
-- ------------------------------------------------------------
COMMENT ON FUNCTION public.confirm_order(uuid) IS
  'DEPRECATED: usar webhook /api/webhooks/pagarme que faz o trabalho equivalente em Node, com idempotência via webhook_events. Mantida pra rollback.';

-- ------------------------------------------------------------
-- 4. Índices úteis pré-piloto (idempotente)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_event_status_paid_at
  ON public.orders (event_id, status, paid_at);

CREATE INDEX IF NOT EXISTS idx_tickets_event_status
  ON public.tickets (event_id, status);

CREATE INDEX IF NOT EXISTS idx_check_ins_event_created
  ON public.check_ins (event_id, created_at DESC);
