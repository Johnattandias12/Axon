-- 014_qr_secret_setup.sql
-- Sem app.qr_secret no Postgres, confirm_order() falha quando webhook chega.
-- Esta migration NÃO seta o valor (faríamos via scripts/setup-qr-secret.mjs
-- usando o QR_HMAC_SECRET do .env), mas garante que a função aceita o valor.
--
-- Pra setar:  ALTER DATABASE postgres SET app.qr_secret = '<QR_HMAC_SECRET>';
-- (rodado uma vez via scripts/set-qr-secret.mjs)

-- Garante extensão pgcrypto (necessária pra hmac() em generate_qr_hash).
create extension if not exists pgcrypto;

-- Documentação inline pra quem ler migrations no futuro.
comment on function public.generate_qr_hash(uuid, uuid) is
  'Gera QR HMAC SHA256 do ticket. Requer app.qr_secret configurado: ALTER DATABASE postgres SET app.qr_secret = ''<QR_HMAC_SECRET>'';';
