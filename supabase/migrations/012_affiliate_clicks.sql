-- ============================================================
-- 012: Rastreamento de Cliques de Afiliados
-- ============================================================

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON public.affiliate_clicks(affiliate_id);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Afiliado pode ler seus próprios cliques
CREATE POLICY "Affiliate reads own clicks" ON public.affiliate_clicks FOR SELECT
  USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

-- O sistema (service_role ou anonimo via API) pode inserir cliques
CREATE POLICY "Anyone can insert clicks" ON public.affiliate_clicks FOR INSERT
  WITH CHECK (true);
