-- 016_wallet_apply.sql
-- RPCs pra aplicar e rollback de créditos AXON no checkout, atomicamente.

create or replace function public.debit_wallet_credit(p_user_id uuid, p_amount bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current bigint;
begin
  if p_amount <= 0 then
    return;
  end if;
  -- lock pessimista pra evitar double-spend
  select wallet_credit_cents into v_current
    from public.profiles
   where id = p_user_id
   for update;
  if v_current is null then
    raise exception 'usuario_nao_encontrado';
  end if;
  if v_current < p_amount then
    raise exception 'saldo_insuficiente: disponivel=%, pedido=%', v_current, p_amount;
  end if;
  update public.profiles
     set wallet_credit_cents = wallet_credit_cents - p_amount
   where id = p_user_id;
end;
$$;

create or replace function public.increment_wallet_credit(p_user_id uuid, p_amount bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    return;
  end if;
  update public.profiles
     set wallet_credit_cents = wallet_credit_cents + p_amount
   where id = p_user_id;
end;
$$;

comment on function public.debit_wallet_credit(uuid, bigint) is
  'Debita creditos do wallet do user, com lock pessimista. Lanca saldo_insuficiente se falhar.';
comment on function public.increment_wallet_credit(uuid, bigint) is
  'Credita amount ao wallet do user — usado pra rollback ou bonus admin.';
