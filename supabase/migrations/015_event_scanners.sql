-- 015_event_scanners.sql
-- Cadastro de scanners (porteiras) por evento, sem precisar criar conta.
-- Produtor cadastra nome + telefone/email → sistema gera token único → envia
-- link via WhatsApp ou email. /scan/[token] valida e libera o scanner.

create table if not exists public.event_scanners (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  phone text,
  email text,
  gate text,
  token text not null unique,
  created_by uuid not null references public.profiles(id) on delete restrict,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists event_scanners_event_idx on public.event_scanners (event_id);
create index if not exists event_scanners_token_idx on public.event_scanners (token);

alter table public.event_scanners enable row level security;

drop policy if exists event_scanners_owner_select on public.event_scanners;
create policy event_scanners_owner_select on public.event_scanners
  for select to authenticated
  using (public.owns_event(event_id) or public.is_admin());

drop policy if exists event_scanners_owner_insert on public.event_scanners;
create policy event_scanners_owner_insert on public.event_scanners
  for insert to authenticated
  with check (public.owns_event(event_id) or public.is_admin());

drop policy if exists event_scanners_owner_update on public.event_scanners;
create policy event_scanners_owner_update on public.event_scanners
  for update to authenticated
  using (public.owns_event(event_id) or public.is_admin())
  with check (public.owns_event(event_id) or public.is_admin());

drop policy if exists event_scanners_owner_delete on public.event_scanners;
create policy event_scanners_owner_delete on public.event_scanners
  for delete to authenticated
  using (public.owns_event(event_id) or public.is_admin());

comment on table public.event_scanners is
  'Scanner cadastrado por evento (nome + token). Service-role valida token em /scan/[token].';
