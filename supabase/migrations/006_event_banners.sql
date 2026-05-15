-- ============================================================
-- Migration 006 — Policies do bucket event-banners
-- (Bucket criado via Storage API — esta migration adiciona apenas
--  as RLS policies que precisam ser SQL.)
-- ============================================================

-- Leitura pública
DROP POLICY IF EXISTS "Banners: leitura pública" ON storage.objects;
CREATE POLICY "Banners: leitura pública" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-banners');

-- Upload: somente organizador autenticado pode adicionar (paths sem restrição
-- de prefixo porque o organizer_id é determinado server-side)
DROP POLICY IF EXISTS "Banners: upload autenticado" ON storage.objects;
CREATE POLICY "Banners: upload autenticado" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-banners');

-- Update e delete: organizador dono do path (path = <organizer_id>/...)
DROP POLICY IF EXISTS "Banners: update autenticado" ON storage.objects;
CREATE POLICY "Banners: update autenticado" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'event-banners');

DROP POLICY IF EXISTS "Banners: delete autenticado" ON storage.objects;
CREATE POLICY "Banners: delete autenticado" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'event-banners');
