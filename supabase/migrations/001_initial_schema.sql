-- ============================================================
-- Migration 001 — Initial Schema
-- AXON: marketplace de ingressos
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       text,
  cpf             text UNIQUE,                  -- considerar criptografar em prod
  phone           text,
  role            text NOT NULL DEFAULT 'buyer'
                  CHECK (role IN ('buyer','organizer','validator','admin')),
  marketing_consent boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ============================================================
-- ORGANIZERS
-- ============================================================
CREATE TABLE public.organizers (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  kind            text NOT NULL CHECK (kind IN ('pf','pj')),
  legal_name      text NOT NULL,
  trade_name      text,
  cnpj_or_cpf     text NOT NULL,
  bank_account    jsonb,
  pagarme_recipient_id text,                    -- id criado na Pagar.me
  kyc_status      text NOT NULL DEFAULT 'pending'
                  CHECK (kyc_status IN ('pending','approved','rejected')),
  fee_pct         numeric(5,2) NOT NULL DEFAULT 0,
  contact_email   text,
  contact_phone   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX idx_organizers_kyc ON public.organizers(kyc_status);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE public.events (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id    uuid NOT NULL REFERENCES public.organizers(id) ON DELETE RESTRICT,
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  description     text,
  category        text NOT NULL DEFAULT 'outro'
                  CHECK (category IN ('show','esporte','religioso','curso','outro')),
  banner_url      text,
  venue_name      text,
  address         text,
  city            text,
  state           text,
  lat             numeric(10,7),
  lng             numeric(10,7),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','published','cancelled','finished')),
  capacity        int NOT NULL DEFAULT 0,
  cover_policy    jsonb NOT NULL DEFAULT '{"refund_days":7,"partial_refund_pct":100}'::jsonb,
  age_rating      text,                          -- "Livre", "16+", etc
  is_nominal      boolean NOT NULL DEFAULT true, -- exige nome do titular
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX idx_events_status_starts ON public.events(status, starts_at)
  WHERE status = 'published';
CREATE INDEX idx_events_city ON public.events(city) WHERE status = 'published';
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_category ON public.events(category) WHERE status = 'published';

-- ============================================================
-- TICKET TYPES
-- ============================================================
CREATE TABLE public.ticket_types (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name            text NOT NULL,                 -- "VIP", "Pista"
  description     text,
  position        int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_types_event ON public.ticket_types(event_id);

-- ============================================================
-- TICKET LOTS
-- ============================================================
CREATE TABLE public.ticket_lots (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_type_id    uuid NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
  event_id          uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name              text NOT NULL,               -- "1º lote"
  price_cents       int NOT NULL CHECK (price_cents >= 0),
  quantity_total    int NOT NULL CHECK (quantity_total > 0),
  quantity_sold     int NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
  quantity_reserved int NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  is_half_price     boolean NOT NULL DEFAULT false,
  starts_at         timestamptz NOT NULL DEFAULT now(),
  ends_at           timestamptz,
  position          int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (quantity_sold + quantity_reserved <= quantity_total)
);

CREATE INDEX idx_lots_type ON public.ticket_lots(ticket_type_id);
CREATE INDEX idx_lots_event ON public.ticket_lots(event_id);
CREATE INDEX idx_lots_active ON public.ticket_lots(event_id, is_half_price)
  WHERE quantity_sold + quantity_reserved < quantity_total;

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE public.orders (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  event_id          uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','cancelled','refunded','expired','failed')),
  subtotal_cents    int NOT NULL CHECK (subtotal_cents >= 0),
  service_fee_cents int NOT NULL DEFAULT 0 CHECK (service_fee_cents >= 0),
  total_cents       int NOT NULL CHECK (total_cents >= 0),
  payment_method    text CHECK (payment_method IN ('pix','credit_card')),
  gateway_order_id  text,
  reserved_until    timestamptz,
  paid_at           timestamptz,
  cancelled_at      timestamptz,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  buyer_ip          inet,
  buyer_user_agent  text,
  fingerprint_id    text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON public.orders(buyer_id, created_at DESC);
CREATE INDEX idx_orders_event ON public.orders(event_id, status);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_expiring ON public.orders(reserved_until)
  WHERE status = 'pending';
CREATE INDEX idx_orders_gateway ON public.orders(gateway_order_id)
  WHERE gateway_order_id IS NOT NULL;

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_lot_id     uuid NOT NULL REFERENCES public.ticket_lots(id) ON DELETE RESTRICT,
  quantity          int NOT NULL CHECK (quantity > 0),
  unit_price_cents  int NOT NULL CHECK (unit_price_cents >= 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE public.tickets (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  ticket_lot_id       uuid NOT NULL REFERENCES public.ticket_lots(id) ON DELETE RESTRICT,
  event_id            uuid NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  qr_hash             text UNIQUE NOT NULL,
  holder_name         text NOT NULL,
  holder_cpf          text NOT NULL,
  is_half_price       boolean NOT NULL DEFAULT false,
  half_price_doc_type text CHECK (half_price_doc_type IN
                       ('estudante','idoso','pcd','jovem_baixa_renda','doador_sangue','professor')),
  half_price_doc_url  text,
  status              text NOT NULL DEFAULT 'valid'
                      CHECK (status IN ('valid','used','cancelled','refunded')),
  used_at             timestamptz,
  used_by             uuid REFERENCES public.profiles(id),
  gate                text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_qr ON public.tickets(qr_hash);
CREATE INDEX idx_tickets_order ON public.tickets(order_id);
CREATE INDEX idx_tickets_event_status ON public.tickets(event_id, status);
CREATE INDEX idx_tickets_holder_cpf ON public.tickets(holder_cpf);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE public.transactions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  gateway         text NOT NULL CHECK (gateway IN ('pagarme','mercadopago')),
  gateway_id      text NOT NULL,
  method          text NOT NULL CHECK (method IN ('pix','credit_card')),
  amount_cents    int NOT NULL,
  status          text NOT NULL CHECK (status IN
                  ('pending','paid','failed','refunded','chargeback')),
  raw_response    jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gateway, gateway_id)
);

CREATE INDEX idx_tx_order ON public.transactions(order_id);
CREATE INDEX idx_tx_status ON public.transactions(status);

-- ============================================================
-- WEBHOOK EVENTS (idempotência)
-- ============================================================
CREATE TABLE public.webhook_events (
  id              text PRIMARY KEY,              -- id do evento no gateway
  gateway         text NOT NULL,
  type            text NOT NULL,
  payload         jsonb NOT NULL,
  processed_at    timestamptz NOT NULL DEFAULT now(),
  error           text
);

CREATE INDEX idx_webhook_gateway ON public.webhook_events(gateway, processed_at DESC);

-- ============================================================
-- PAYOUTS
-- ============================================================
CREATE TABLE public.payouts (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id    uuid NOT NULL REFERENCES public.organizers(id) ON DELETE RESTRICT,
  amount_cents    int NOT NULL CHECK (amount_cents > 0),
  status          text NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested','processing','paid','failed','cancelled')),
  bank_snapshot   jsonb NOT NULL,
  gateway_payout_id text,
  requested_at    timestamptz NOT NULL DEFAULT now(),
  paid_at         timestamptz,
  failure_reason  text
);

CREATE INDEX idx_payouts_organizer ON public.payouts(organizer_id, requested_at DESC);

-- ============================================================
-- REFUNDS
-- ============================================================
CREATE TABLE public.refunds (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  ticket_id       uuid REFERENCES public.tickets(id),
  reason          text NOT NULL CHECK (reason IN
                  ('cdc_7_days','event_cancelled','fraud','organizer_decision','duplicate')),
  amount_cents    int NOT NULL CHECK (amount_cents > 0),
  status          text NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested','approved','rejected','paid')),
  requested_by    uuid REFERENCES public.profiles(id),
  approved_by     uuid REFERENCES public.profiles(id),
  approved_at     timestamptz,
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_refunds_order ON public.refunds(order_id);
CREATE INDEX idx_refunds_status ON public.refunds(status);

-- ============================================================
-- EVENT VALIDATORS
-- ============================================================
CREATE TABLE public.event_validators (
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gate            text,
  added_by        uuid REFERENCES public.profiles(id),
  added_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX idx_validators_user ON public.event_validators(user_id);

-- ============================================================
-- CHECK INS (auditoria de scans)
-- ============================================================
CREATE TABLE public.check_ins (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id       uuid REFERENCES public.tickets(id),
  event_id        uuid NOT NULL REFERENCES public.events(id),
  validator_id    uuid REFERENCES public.profiles(id),
  result          text NOT NULL CHECK (result IN
                  ('valid','already_used','invalid_hmac','cancelled','refunded','not_found','wrong_event')),
  scanned_at      timestamptz NOT NULL DEFAULT now(),
  gate            text,
  offline_synced  boolean NOT NULL DEFAULT false,
  payload_hash    text                           -- guarda hash mesmo se ticket NULL
);

CREATE INDEX idx_checkins_event_time ON public.check_ins(event_id, scanned_at DESC);
CREATE INDEX idx_checkins_ticket ON public.check_ins(ticket_id);

-- ============================================================
-- FRAUD FLAGS
-- ============================================================
CREATE TABLE public.fraud_flags (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rule            text NOT NULL,
  score           int NOT NULL CHECK (score BETWEEN 0 AND 100),
  decision        text NOT NULL CHECK (decision IN ('allow','review','deny')),
  reasons         jsonb,
  reviewed_by     uuid REFERENCES public.profiles(id),
  reviewed_at     timestamptz,
  final_decision  text CHECK (final_decision IN ('allow','deny')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_flags_order ON public.fraud_flags(order_id);
CREATE INDEX idx_flags_pending ON public.fraud_flags(decision)
  WHERE final_decision IS NULL AND decision = 'review';

-- ============================================================
-- AUDIT LOGS (LGPD + segurança)
-- ============================================================
CREATE TABLE public.audit_logs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id        uuid REFERENCES public.profiles(id),
  action          text NOT NULL,
  target_table    text,
  target_id       uuid,
  metadata        jsonb,
  ip              inet,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_target ON public.audit_logs(target_table, target_id);

-- ============================================================
-- TRIGGERS de updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','organizers','events','orders','transactions']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t, t);
  END LOOP;
END $$;

-- ============================================================
-- TRIGGER: criar profile no signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN NEW.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
        THEN 'admin'
      ELSE 'buyer'
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
