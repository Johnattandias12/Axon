-- ============================================================
-- WIPE MY ORDERS — Limpa compras demo do owner pra reteste limpo.
-- Rode no Supabase SQL Editor (autenticado como service_role).
-- Troque o email se quiser zerar outro usuário.
-- ============================================================

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'johnattan.dias@gmail.com'; -- <<< MUDE SE QUISER OUTRO
  v_orders_count int;
  v_tickets_count int;
  v_cart_count int;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado em auth.users', v_email;
  END IF;

  RAISE NOTICE 'Limpando pedidos do user_id=% (%)', v_user_id, v_email;

  -- 1) Devolve estoque dos lotes (decrementa quantity_sold pelo que vai sumir)
  UPDATE public.ticket_lots tl
     SET quantity_sold = GREATEST(tl.quantity_sold - sub.qty, 0)
    FROM (
      SELECT oi.ticket_lot_id, SUM(oi.quantity)::int AS qty
        FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        WHERE o.buyer_id = v_user_id
        GROUP BY oi.ticket_lot_id
    ) sub
   WHERE tl.id = sub.ticket_lot_id;

  -- 2) Apaga referrals que apontam pras orders dele (afiliados)
  --    Usa um sub-select tolerante a tabela inexistente.
  BEGIN
    DELETE FROM public.affiliate_referrals
     WHERE order_id IN (SELECT id FROM public.orders WHERE buyer_id = v_user_id);
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'Tabela affiliate_referrals não existe — migration 008 não aplicada. Ignorando.';
  END;

  -- 3) Apaga check_ins ligados aos tickets dele
  DELETE FROM public.check_ins
   WHERE ticket_id IN (
     SELECT t.id FROM public.tickets t
       JOIN public.orders o ON o.id = t.order_id
      WHERE o.buyer_id = v_user_id
   );

  -- 4) Apaga tickets
  SELECT COUNT(*) INTO v_tickets_count
    FROM public.tickets t
    JOIN public.orders o ON o.id = t.order_id
   WHERE o.buyer_id = v_user_id;

  DELETE FROM public.tickets
   WHERE order_id IN (SELECT id FROM public.orders WHERE buyer_id = v_user_id);

  -- 5) Apaga order_items
  DELETE FROM public.order_items
   WHERE order_id IN (SELECT id FROM public.orders WHERE buyer_id = v_user_id);

  -- 6) Apaga orders
  SELECT COUNT(*) INTO v_orders_count FROM public.orders WHERE buyer_id = v_user_id;
  DELETE FROM public.orders WHERE buyer_id = v_user_id;

  -- 7) Limpa carrinho
  SELECT COUNT(*) INTO v_cart_count FROM public.cart_items WHERE user_id = v_user_id;
  DELETE FROM public.cart_items WHERE user_id = v_user_id;

  RAISE NOTICE 'Done. Removidos: % orders, % tickets, % cart_items.',
    v_orders_count, v_tickets_count, v_cart_count;
END $$;
