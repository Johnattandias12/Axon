-- ============================================================
-- Migration 019 — Auto-refund de tickets ao mudar order
-- Quando order.status vai para 'refunded' ou 'canceled', todos os
-- tickets daquela order recebem status='refunded' (ou 'cancelled' em
-- canceled). Sem isso, ingresso refunded continuaria escaneável.
-- ============================================================

CREATE OR REPLACE FUNCTION public.propagate_order_status_to_tickets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_ticket_status text;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'refunded' THEN
    v_new_ticket_status := 'refunded';
  ELSIF NEW.status = 'canceled' OR NEW.status = 'cancelled' THEN
    v_new_ticket_status := 'cancelled';
  ELSE
    RETURN NEW;
  END IF;

  UPDATE public.tickets
    SET status = v_new_ticket_status
    WHERE order_id = NEW.id
      AND status = 'valid';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_propagate_order_status ON public.orders;
CREATE TRIGGER trg_propagate_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.propagate_order_status_to_tickets();

-- ------------------------------------------------------------
-- Idempotência: garante que orders.status='refunded' não regredir
-- pra outra coisa que não seja 'refunded'. (defesa em profundidade)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_order_terminal_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'refunded' AND NEW.status <> 'refunded' THEN
    RAISE EXCEPTION 'order_refunded_immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_order_terminal ON public.orders;
CREATE TRIGGER trg_guard_order_terminal
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_order_terminal_status();
