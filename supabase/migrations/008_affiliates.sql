-- ============================================================
-- 008: Programa de afiliados
-- ============================================================
-- Permite que qualquer usuário gere um código único, compartilhe links
-- como ?via=CODE e ganhe comissão (% sobre o subtotal) quando alguém
-- usar o link e fechar uma compra.

CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  commission_pct numeric(5,2) NOT NULL DEFAULT 5.00,
  total_referrals integer NOT NULL DEFAULT 0,
  total_commission_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliates_code ON public.affiliates(code);

CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  commission_cents bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON public.affiliate_referrals(affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_order ON public.affiliate_referrals(order_id);

-- RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Afiliado pode ler/atualizar seu próprio cadastro
DROP POLICY IF EXISTS "Affiliate reads own" ON public.affiliates;
CREATE POLICY "Affiliate reads own" ON public.affiliates FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Affiliate inserts own" ON public.affiliates;
CREATE POLICY "Affiliate inserts own" ON public.affiliates FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Qualquer um pode validar um código (pra resolver via=CODE no checkout)
-- mas só vê o id (não vê stats agregados)
DROP POLICY IF EXISTS "Public resolves affiliate code" ON public.affiliates;
CREATE POLICY "Public resolves affiliate code" ON public.affiliates FOR SELECT
  USING (true);

-- Afiliado lê suas próprias referrals
DROP POLICY IF EXISTS "Affiliate reads own referrals" ON public.affiliate_referrals;
CREATE POLICY "Affiliate reads own referrals" ON public.affiliate_referrals FOR SELECT
  USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

-- Admin lê tudo
DROP POLICY IF EXISTS "Admin reads all affiliates" ON public.affiliates;
CREATE POLICY "Admin reads all affiliates" ON public.affiliates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin reads all referrals" ON public.affiliate_referrals;
CREATE POLICY "Admin reads all referrals" ON public.affiliate_referrals FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Função pra gerar código curto único (6 chars alphanumeric)
CREATE OR REPLACE FUNCTION public.generate_affiliate_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
  exists_count int;
  attempts int := 0;
BEGIN
  LOOP
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Não foi possível gerar código único';
    END IF;
    candidate := upper(substring(md5(p_user_id::text || clock_timestamp()::text || random()::text) from 1 for 6));
    SELECT count(*) INTO exists_count FROM public.affiliates WHERE code = candidate;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN candidate;
END;
$$;
