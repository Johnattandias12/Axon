-- ============================================================
-- Migration 019 — Corrige trigger meia-entrada
-- Problema: trg_validate_half_price_lots bloqueava qualquer update
-- em quantity_total mesmo para eventos que JÁ estavam com ratio < 40%
-- (dados criados antes da migration 018). Isso quebrava compras reais
-- e demos que expandiam capacidade.
--
-- Fix: só bloqueia se o ratio CAIU para abaixo de 40% como resultado
-- desta mudança específica. Se o evento já estava abaixo, permite a
-- mudança (legacy data tolerance).
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_half_price_quota_on_lot()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_total int;
  v_half int;
  v_prev_total int;
  v_prev_half int;
  v_status text;
  v_event_id uuid;
BEGIN
  -- Se for UPDATE e não mudou os campos relevantes de cota,
  -- pula imediatamente (ex: atualização de quantity_sold/quantity_reserved)
  IF (TG_OP = 'UPDATE'
      AND OLD.quantity_total = NEW.quantity_total
      AND OLD.is_half_price = NEW.is_half_price) THEN
    RETURN NEW;
  END IF;

  v_event_id := COALESCE(NEW.event_id, OLD.event_id);

  SELECT status INTO v_status FROM public.events WHERE id = v_event_id;
  IF v_status <> 'published' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calcula ratio ATUAL (pós-mudança)
  SELECT
    COALESCE(SUM(quantity_total), 0),
    COALESCE(SUM(CASE WHEN is_half_price THEN quantity_total ELSE 0 END), 0)
    INTO v_total, v_half
    FROM public.ticket_lots
    WHERE event_id = v_event_id;

  IF v_total = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Se ratio ainda está acima de 40%, tudo bem
  IF (v_half::numeric / v_total::numeric) >= 0.40 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Ratio ficou abaixo de 40% — calcula o ratio ANTES desta mudança
  -- para saber se JÁ estava ruim ou se esta mudança causou o problema
  IF TG_OP = 'INSERT' THEN
    v_prev_total := v_total - NEW.quantity_total;
    v_prev_half  := v_half - CASE WHEN NEW.is_half_price THEN NEW.quantity_total ELSE 0 END;
  ELSIF TG_OP = 'DELETE' THEN
    v_prev_total := v_total + OLD.quantity_total;
    v_prev_half  := v_half + CASE WHEN OLD.is_half_price THEN OLD.quantity_total ELSE 0 END;
  ELSE -- UPDATE
    v_prev_total := v_total - NEW.quantity_total + OLD.quantity_total;
    v_prev_half  := v_half
                    - CASE WHEN NEW.is_half_price THEN NEW.quantity_total ELSE 0 END
                    + CASE WHEN OLD.is_half_price THEN OLD.quantity_total ELSE 0 END;
  END IF;

  -- Só rejeita se o ratio CAIU abaixo de 40% como resultado desta mudança
  -- (antes estava OK). Se já estava abaixo (dados legados), permite.
  IF v_prev_total > 0 AND (v_prev_half::numeric / v_prev_total::numeric) >= 0.40 THEN
    RAISE EXCEPTION 'meia_entrada_insuficiente: % de % (mínimo 40%%)', v_half, v_total
      USING ERRCODE = 'P0001';
  END IF;

  -- Ratio já estava ruim antes desta mudança — permite (tolerância a dados legados)
  RETURN COALESCE(NEW, OLD);
END;
$$;
