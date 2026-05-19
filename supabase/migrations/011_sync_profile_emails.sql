-- ============================================================
-- Migration 011 — Adiciona e sincroniza coluna email em profiles
-- ============================================================

-- 1. Adicionar coluna email na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Sincronizar emails existentes de auth.users para public.profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Atualizar a função handle_new_user para incluir o email no insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE
      WHEN NEW.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
        THEN 'admin'
      ELSE 'buyer'
    END
  );
  RETURN NEW;
END;
$$;
