-- ============================================================
-- 009: Programa de afiliados fechado (por convite) + crédito wallet
-- ============================================================
-- Muda o programa de "auto-cadastro" para "convite do admin".
-- Adiciona crédito wallet no profile (afiliado recebe comissão como crédito
-- na plataforma, liberado manualmente pelo admin).

-- 1. Status no afiliado
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'rejected'));
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);

-- 2. Convites (admin cria, candidato aceita via /afiliado/convite/[token])
CREATE TABLE IF NOT EXISTS public.affiliate_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  commission_pct numeric(5,2) NOT NULL DEFAULT 5.00
    CHECK (commission_pct >= 0 AND commission_pct <= 50),
  note text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  used_at timestamptz,
  used_by uuid REFERENCES public.profiles(id),
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invites_email ON public.affiliate_invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.affiliate_invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_used ON public.affiliate_invites(used_at);

ALTER TABLE public.affiliate_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages invites" ON public.affiliate_invites;
CREATE POLICY "Admin manages invites" ON public.affiliate_invites FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Wallet no profile (crédito disponível + bloqueado/em-analise)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_credit_cents bigint NOT NULL DEFAULT 0
    CHECK (wallet_credit_cents >= 0);
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_held_cents bigint NOT NULL DEFAULT 0
    CHECK (wallet_held_cents >= 0);

-- 4. Trigger: quando uma referral vira 'paid', credita wallet do afiliado
CREATE OR REPLACE FUNCTION public.credit_affiliate_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    SELECT user_id INTO v_user_id
      FROM public.affiliates WHERE id = NEW.affiliate_id;
    IF v_user_id IS NOT NULL THEN
      UPDATE public.profiles
         SET wallet_credit_cents = wallet_credit_cents + NEW.commission_cents
       WHERE id = v_user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_affiliate_wallet ON public.affiliate_referrals;
CREATE TRIGGER trg_credit_affiliate_wallet
  AFTER UPDATE OF status ON public.affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.credit_affiliate_wallet();

-- 5. Hardening: remove auto-cadastro de afiliado.
-- Após esta migration, novos affiliates só podem ser criados via service_role
-- (server action que valida invite_token).
DROP POLICY IF EXISTS "Affiliate inserts own" ON public.affiliates;
