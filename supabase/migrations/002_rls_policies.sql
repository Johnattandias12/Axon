-- ============================================================
-- Migration 002 — Row Level Security
-- ============================================================

-- ------------------------------------------------------------
-- Helper functions
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_organizer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('organizer','admin'));
$$;

CREATE OR REPLACE FUNCTION public.organizer_id_of_user()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.organizers WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.owns_event(p_event_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.organizers o ON o.id = e.organizer_id
    WHERE e.id = p_event_id AND o.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_validate_event(p_event_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    public.is_admin()
    OR public.owns_event(p_event_id)
    OR EXISTS (
      SELECT 1 FROM public.event_validators
      WHERE event_id = p_event_id AND user_id = auth.uid()
    );
$$;

-- ------------------------------------------------------------
-- Habilitar RLS em TODAS as tabelas
-- ------------------------------------------------------------
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_lots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_validators  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_flags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "user reads own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "user updates own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
  -- não pode mudar a própria role

CREATE POLICY "admin can update any profile"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- ORGANIZERS
-- ============================================================
CREATE POLICY "organizer reads own"
  ON public.organizers FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "organizer inserts own"
  ON public.organizers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "organizer updates own"
  ON public.organizers FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- EVENTS
-- ============================================================
CREATE POLICY "public reads published events"
  ON public.events FOR SELECT
  USING (status = 'published' OR public.owns_event(id) OR public.is_admin());

CREATE POLICY "organizer manages own events"
  ON public.events FOR ALL
  USING (public.owns_event(id) OR public.is_admin())
  WITH CHECK (
    organizer_id = public.organizer_id_of_user() OR public.is_admin()
  );

-- ============================================================
-- TICKET TYPES
-- ============================================================
CREATE POLICY "public reads types of published events"
  ON public.ticket_types FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e
            WHERE e.id = event_id AND
                  (e.status = 'published' OR public.owns_event(e.id) OR public.is_admin()))
  );

CREATE POLICY "organizer manages types of own events"
  ON public.ticket_types FOR ALL
  USING (public.owns_event(event_id) OR public.is_admin())
  WITH CHECK (public.owns_event(event_id) OR public.is_admin());

-- ============================================================
-- TICKET LOTS
-- ============================================================
CREATE POLICY "public reads lots of published events"
  ON public.ticket_lots FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e
            WHERE e.id = event_id AND
                  (e.status = 'published' OR public.owns_event(e.id) OR public.is_admin()))
  );

CREATE POLICY "organizer manages lots of own events"
  ON public.ticket_lots FOR ALL
  USING (public.owns_event(event_id) OR public.is_admin())
  WITH CHECK (public.owns_event(event_id) OR public.is_admin());

-- ============================================================
-- ORDERS
-- ============================================================
CREATE POLICY "buyer reads own orders"
  ON public.orders FOR SELECT
  USING (buyer_id = auth.uid() OR public.owns_event(event_id) OR public.is_admin());

-- Inserção feita só via server action com auth; policy garante consistência
CREATE POLICY "buyer creates own order"
  ON public.orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- UPDATE: só admin direto. Compradores só cancelam via função.
CREATE POLICY "admin updates orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE POLICY "follows order visibility"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND
                  (o.buyer_id = auth.uid() OR public.owns_event(o.event_id) OR public.is_admin()))
  );

CREATE POLICY "buyer inserts items of own order"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND o.buyer_id = auth.uid())
  );

-- ============================================================
-- TICKETS
-- ============================================================
CREATE POLICY "buyer reads own tickets"
  ON public.tickets FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND o.buyer_id = auth.uid())
    OR public.owns_event(event_id)
    OR public.can_validate_event(event_id)
    OR public.is_admin()
  );

-- UPDATE de tickets só via função validate_ticket() ou admin
CREATE POLICY "admin updates tickets"
  ON public.tickets FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE POLICY "buyer reads own tx"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND
                  (o.buyer_id = auth.uid() OR public.owns_event(o.event_id) OR public.is_admin()))
  );

-- ============================================================
-- WEBHOOK EVENTS (só service_role)
-- ============================================================
-- Sem policies = só service_role acessa. Perfeito.

-- ============================================================
-- PAYOUTS
-- ============================================================
CREATE POLICY "organizer reads own payouts"
  ON public.payouts FOR SELECT
  USING (organizer_id = public.organizer_id_of_user() OR public.is_admin());

CREATE POLICY "organizer requests own payout"
  ON public.payouts FOR INSERT
  WITH CHECK (organizer_id = public.organizer_id_of_user());

-- ============================================================
-- REFUNDS
-- ============================================================
CREATE POLICY "buyer reads own refunds"
  ON public.refunds FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND
                  (o.buyer_id = auth.uid() OR public.owns_event(o.event_id) OR public.is_admin()))
  );

CREATE POLICY "buyer requests refund"
  ON public.refunds FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND o.buyer_id = auth.uid())
  );

CREATE POLICY "organizer or admin updates refund"
  ON public.refunds FOR UPDATE
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_id AND public.owns_event(o.event_id))
  );

-- ============================================================
-- EVENT VALIDATORS
-- ============================================================
CREATE POLICY "organizer manages validators of own events"
  ON public.event_validators FOR ALL
  USING (public.owns_event(event_id) OR public.is_admin())
  WITH CHECK (public.owns_event(event_id) OR public.is_admin());

CREATE POLICY "validator reads own assignments"
  ON public.event_validators FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- CHECK INS
-- ============================================================
CREATE POLICY "organizer reads checkins of own events"
  ON public.check_ins FOR SELECT
  USING (public.owns_event(event_id) OR public.can_validate_event(event_id) OR public.is_admin());

-- INSERT: só via função validate_ticket() ou service_role.

-- ============================================================
-- FRAUD FLAGS — só admin
-- ============================================================
CREATE POLICY "admin reads flags"
  ON public.fraud_flags FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin updates flags"
  ON public.fraud_flags FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- AUDIT LOGS — só admin pode ler
-- ============================================================
CREATE POLICY "admin reads audit"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

-- INSERT via service_role / functions só.
