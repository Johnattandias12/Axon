-- 013_email_logs.sql
-- Auditoria de envios transacionais (Resend). Toda chamada de sendEmail() loga aqui.
-- Usuário final lê só os próprios; admin lê tudo.

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  to_email text not null,
  email_type text not null check (
    email_type in (
      'ticket_confirmation',
      'ticket_transfer',
      'refund_processed',
      'login_notification',
      'password_reset',
      'magic_link',
      'signup_confirmation',
      'scanner_invite',
      'crew_invite',
      'affiliate_commission'
    )
  ),
  subject text not null,
  status text not null check (status in ('sent','failed','disabled')),
  provider text not null default 'resend',
  provider_id text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_logs_user_id_idx on public.email_logs (user_id);
create index if not exists email_logs_to_email_idx on public.email_logs (to_email);
create index if not exists email_logs_created_at_idx on public.email_logs (created_at desc);
create index if not exists email_logs_type_status_idx on public.email_logs (email_type, status);

alter table public.email_logs enable row level security;

drop policy if exists email_logs_admin_read on public.email_logs;
create policy email_logs_admin_read on public.email_logs
  for select to authenticated
  using (public.is_admin());

drop policy if exists email_logs_owner_read on public.email_logs;
create policy email_logs_owner_read on public.email_logs
  for select to authenticated
  using (user_id = auth.uid());

-- Sem policy de INSERT/UPDATE/DELETE: só service_role escreve (via lib/email/send.ts).

comment on table public.email_logs is 'Auditoria de envios transacionais via Resend. Insert apenas via service_role.';
