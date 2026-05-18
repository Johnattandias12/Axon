-- ============================================================
-- Migration 009 — Payment Methods Configuration per Event
-- Permite que o organizador defina quais meios de pagamento
-- ficam disponíveis no checkout do seu evento.
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS payment_methods jsonb NOT NULL DEFAULT '{
    "pix": true,
    "credit_card": false,
    "max_installments": 1,
    "convenience_fee_pix_cents": 100,
    "convenience_fee_credit_pct": 5
  }'::jsonb;

COMMENT ON COLUMN public.events.payment_methods IS
  'Configuração de meios de pagamento do evento. 
   pix: boolean — aceita Pix (recomendado, recebimento imediato)
   credit_card: boolean — aceita cartão de crédito (D+15)
   max_installments: 1|2|3|6|12 — máximo de parcelas permitidas
   convenience_fee_pix_cents: taxa fixa em centavos cobrada no Pix (padrão 100 = R$1,00)
   convenience_fee_credit_pct: % adicional cobrado no cartão (padrão 5 = 5%)';

-- Função para retornar as taxas calculadas para o checkout
CREATE OR REPLACE FUNCTION public.get_payment_fees(
  p_event_id uuid,
  p_price_cents int,
  p_quantity int,
  p_method text,         -- 'pix' | 'credit_card'
  p_installments int DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg jsonb;
  v_subtotal int;
  v_convenience int;
  v_axon_fee int;
  v_total int;
  v_installment_pct numeric;
BEGIN
  SELECT payment_methods INTO v_cfg
  FROM public.events
  WHERE id = p_event_id;

  IF v_cfg IS NULL THEN
    RAISE EXCEPTION 'evento_nao_encontrado';
  END IF;

  v_subtotal := p_price_cents * p_quantity;

  -- Taxa de conveniência por método
  IF p_method = 'pix' THEN
    -- Fixa por pedido (não por ingresso)
    v_convenience := COALESCE((v_cfg->>'convenience_fee_pix_cents')::int, 100);
  ELSIF p_method = 'credit_card' THEN
    -- Percentual sobre o subtotal + acréscimo por parcelas
    v_installment_pct := CASE p_installments
      WHEN 1  THEN COALESCE((v_cfg->>'convenience_fee_credit_pct')::numeric, 5)
      WHEN 2  THEN COALESCE((v_cfg->>'convenience_fee_credit_pct')::numeric, 5) + 3
      WHEN 3  THEN COALESCE((v_cfg->>'convenience_fee_credit_pct')::numeric, 5) + 5
      WHEN 6  THEN COALESCE((v_cfg->>'convenience_fee_credit_pct')::numeric, 5) + 9
      WHEN 12 THEN COALESCE((v_cfg->>'convenience_fee_credit_pct')::numeric, 5) + 15
      ELSE         COALESCE((v_cfg->>'convenience_fee_credit_pct')::numeric, 5)
    END;
    v_convenience := ROUND(v_subtotal * v_installment_pct / 100);
  ELSE
    RAISE EXCEPTION 'metodo_invalido';
  END IF;

  -- Taxa de serviço AXON: 9% sobre o subtotal do ingresso
  v_axon_fee := ROUND(v_subtotal * 0.09);

  v_total := v_subtotal + v_convenience;

  RETURN jsonb_build_object(
    'subtotal_cents',     v_subtotal,
    'convenience_cents',  v_convenience,
    'axon_fee_cents',     v_axon_fee,
    'total_cents',        v_total,
    'installments',       p_installments,
    'installment_value_cents', CASE WHEN p_installments > 1 THEN ROUND(v_total::numeric / p_installments) ELSE v_total END,
    'method',             p_method
  );
END;
$$;
