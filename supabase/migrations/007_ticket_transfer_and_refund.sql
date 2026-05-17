-- ============================================================
-- 007: Transferência de ingresso + solicitação de reembolso
-- ============================================================
-- Permite o comprador transferir ingresso (gera token único de 7 dias)
-- ou solicitar reembolso (status 'paused' aguardando análise).

-- Atualiza CHECK do status pra incluir 'paused'
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('valid','used','cancelled','refunded','paused'));

-- Colunas de transferência e reembolso
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS transfer_token uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS transfer_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS transferred_from uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS transferred_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_reason text;

CREATE INDEX IF NOT EXISTS idx_tickets_transfer_token
  ON public.tickets(transfer_token) WHERE transfer_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_refund_requested
  ON public.tickets(refund_requested_at) WHERE refund_requested_at IS NOT NULL;

-- Policy de leitura por token (pra página /transferir/[token] funcionar
-- mesmo sem o user ser o buyer original)
CREATE POLICY IF NOT EXISTS "Public can read ticket by transfer token"
  ON public.tickets FOR SELECT
  USING (
    transfer_token IS NOT NULL
    AND transfer_expires_at > now()
    AND status = 'paused'
  );

-- check_ins.result aceita 'paused' (validador pode escanear ingresso pausado e ver o motivo)
ALTER TABLE public.check_ins DROP CONSTRAINT IF EXISTS check_ins_result_check;
ALTER TABLE public.check_ins ADD CONSTRAINT check_ins_result_check
  CHECK (result IN ('valid','already_used','invalid_hmac','cancelled','refunded','paused','not_found','wrong_event'));
