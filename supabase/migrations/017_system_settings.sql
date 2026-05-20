-- Migration 017 — System Settings Table for Toggling Payment Mode
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view system_settings" ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "Admin can modify system_settings" ON public.system_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Default Seed for payment_mode (real by default if PAGARME_API_KEY exists, otherwise test)
INSERT INTO public.system_settings (key, value)
VALUES ('payment_mode', 'real')
ON CONFLICT (key) DO NOTHING;
