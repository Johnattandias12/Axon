-- ============================================================
-- Migration 004 — Seed (apenas dev/staging)
-- NÃO rodar em produção
-- ============================================================

-- Defina o QR secret para dev local (em prod use ALTER DATABASE)
-- ALTER DATABASE postgres SET app.qr_secret = 'dev-secret-trocar-em-prod';
-- ALTER DATABASE postgres SET app.admin_emails = 'johnattan@axon.com.br';

-- Para popular dados de teste, crie um usuário primeiro via Supabase Studio
-- ou via auth.sign_up, depois rode:

-- INSERT INTO public.organizers (user_id, kind, legal_name, trade_name, cnpj_or_cpf, kyc_status)
-- VALUES (
--   '<user_id_aqui>',
--   'pj',
--   'Eventos Demo LTDA',
--   'Demo Events',
--   '00.000.000/0001-00',
--   'approved'
-- );

-- Evento de demonstração
-- INSERT INTO public.events (organizer_id, slug, title, description, category,
--                            venue_name, city, state, starts_at, status, capacity)
-- VALUES (
--   (SELECT id FROM public.organizers LIMIT 1),
--   'show-demo-2026',
--   'Show Demo 2026',
--   'Evento de demonstração da AXON',
--   'show',
--   'Casa de Show Demo',
--   'Natal',
--   'RN',
--   now() + INTERVAL '30 days',
--   'draft',
--   500
-- );

-- (Continuar adicionando ticket_types e ticket_lots conforme necessário)
