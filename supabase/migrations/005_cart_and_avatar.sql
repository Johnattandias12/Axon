-- ============================================================
-- Migration 005 — Carrinho persistente + avatar de perfil
-- ============================================================

-- ─── Avatar no profile ──────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- ─── Carrinho de compras ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_lot_id   uuid NOT NULL REFERENCES public.ticket_lots(id) ON DELETE CASCADE,
  quantity        int NOT NULL DEFAULT 1
                  CHECK (quantity > 0 AND quantity <= 10),
  holder_name     text,
  holder_cpf      text,
  added_at        timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ticket_lot_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items(user_id, added_at DESC);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_select_own" ON public.cart_items;
CREATE POLICY "cart_select_own" ON public.cart_items
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_insert_own" ON public.cart_items;
CREATE POLICY "cart_insert_own" ON public.cart_items
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_update_own" ON public.cart_items;
CREATE POLICY "cart_update_own" ON public.cart_items
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_delete_own" ON public.cart_items;
CREATE POLICY "cart_delete_own" ON public.cart_items
  FOR DELETE USING (user_id = auth.uid());

-- ─── Trigger updated_at ─────────────────────────────────────
DROP TRIGGER IF EXISTS trg_cart_updated ON public.cart_items;
CREATE TRIGGER trg_cart_updated
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Storage: bucket avatars (público para leitura) ─────────
-- Cria o bucket se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/png','image/jpeg','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policy: qualquer um pode ler avatares
DROP POLICY IF EXISTS "Avatares: leitura pública" ON storage.objects;
CREATE POLICY "Avatares: leitura pública" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Policy: usuário autenticado faz upload do próprio avatar
-- (path deve começar com o user_id seguido de /)
DROP POLICY IF EXISTS "Avatares: upload próprio" ON storage.objects;
CREATE POLICY "Avatares: upload próprio" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: usuário autenticado atualiza/sobrescreve o próprio avatar
DROP POLICY IF EXISTS "Avatares: update próprio" ON storage.objects;
CREATE POLICY "Avatares: update próprio" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: usuário autenticado deleta o próprio avatar
DROP POLICY IF EXISTS "Avatares: delete próprio" ON storage.objects;
CREATE POLICY "Avatares: delete próprio" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
