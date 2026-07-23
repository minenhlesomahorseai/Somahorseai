-- Multi-currency preferences and immutable payment/payout FX snapshots.
--
-- Existing project and earnings amounts remain in whole ZAR. They are the
-- canonical accounting ledger used for quotes and the 60/40 allocation. New
-- *_amount_minor fields record the exact amount in the external currency's
-- lowest denomination (cents for USD, whole units for JPY, and so on).

alter table public.profiles
  add column if not exists preferred_currency text not null default 'ZAR',
  add column if not exists country_code text;

alter table public.profiles
  drop constraint if exists profiles_preferred_currency_format;
alter table public.profiles
  add constraint profiles_preferred_currency_format
  check (preferred_currency ~ '^[A-Z]{3}$');

alter table public.profiles
  drop constraint if exists profiles_country_code_format;
alter table public.profiles
  add constraint profiles_country_code_format
  check (country_code is null or country_code ~ '^[A-Z]{2}$');

alter table public.projects
  add column if not exists client_currency text,
  add column if not exists client_country_code text;

update public.projects
set client_currency = coalesce(client_currency, currency, 'ZAR')
where client_currency is null;

alter table public.projects
  drop constraint if exists projects_client_currency_format;
alter table public.projects
  add constraint projects_client_currency_format
  check (client_currency is null or client_currency ~ '^[A-Z]{3}$');

alter table public.projects
  drop constraint if exists projects_client_country_code_format;
alter table public.projects
  add constraint projects_client_country_code_format
  check (
    client_country_code is null or client_country_code ~ '^[A-Z]{2}$'
  );

alter table public.payments
  add column if not exists base_currency text not null default 'ZAR',
  add column if not exists presentment_amount_minor bigint,
  add column if not exists presentment_currency text,
  add column if not exists fx_rate numeric(24, 12),
  add column if not exists fx_source text,
  add column if not exists fx_quoted_at timestamptz;

update public.payments
set
  base_currency = coalesce(currency, 'ZAR'),
  presentment_amount_minor = coalesce(presentment_amount_minor, amount * 100),
  presentment_currency = coalesce(presentment_currency, currency, 'ZAR'),
  fx_rate = coalesce(fx_rate, 1),
  fx_source = coalesce(fx_source, 'legacy_identity'),
  fx_quoted_at = coalesce(fx_quoted_at, created_at)
where
  presentment_amount_minor is null
  or presentment_currency is null
  or fx_rate is null
  or fx_source is null
  or fx_quoted_at is null;

alter table public.payments
  drop constraint if exists payments_base_currency_format;
alter table public.payments
  add constraint payments_base_currency_format
  check (base_currency ~ '^[A-Z]{3}$');

alter table public.payments
  drop constraint if exists payments_presentment_currency_format;
alter table public.payments
  add constraint payments_presentment_currency_format
  check (
    presentment_currency is null
    or presentment_currency ~ '^[A-Z]{3}$'
  );

alter table public.payments
  drop constraint if exists payments_presentment_amount_nonnegative;
alter table public.payments
  add constraint payments_presentment_amount_nonnegative
  check (
    presentment_amount_minor is null
    or presentment_amount_minor >= 0
  );

alter table public.payments
  drop constraint if exists payments_fx_rate_positive;
alter table public.payments
  add constraint payments_fx_rate_positive
  check (fx_rate is null or fx_rate > 0);

alter table public.talent_earnings
  add column if not exists base_currency text not null default 'ZAR',
  add column if not exists payout_amount_minor bigint,
  add column if not exists payout_currency text,
  add column if not exists payout_fx_rate numeric(24, 12),
  add column if not exists payout_fx_source text,
  add column if not exists payout_fx_quoted_at timestamptz;

alter table public.talent_earnings
  drop constraint if exists talent_earnings_base_currency_format;
alter table public.talent_earnings
  add constraint talent_earnings_base_currency_format
  check (base_currency ~ '^[A-Z]{3}$');

alter table public.talent_earnings
  drop constraint if exists talent_earnings_payout_currency_format;
alter table public.talent_earnings
  add constraint talent_earnings_payout_currency_format
  check (payout_currency is null or payout_currency ~ '^[A-Z]{3}$');

alter table public.talent_earnings
  drop constraint if exists talent_earnings_payout_amount_nonnegative;
alter table public.talent_earnings
  add constraint talent_earnings_payout_amount_nonnegative
  check (payout_amount_minor is null or payout_amount_minor >= 0);

alter table public.talent_earnings
  drop constraint if exists talent_earnings_payout_fx_rate_positive;
alter table public.talent_earnings
  add constraint talent_earnings_payout_fx_rate_positive
  check (payout_fx_rate is null or payout_fx_rate > 0);

-- Recreate the auth trigger so both email/password and OAuth signups persist
-- the user's explicit currency choice. Invalid/missing metadata safely falls
-- back to the canonical currency.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_currency text;
  v_country text;
begin
  v_currency := upper(coalesce(new.raw_user_meta_data ->> 'preferred_currency', 'ZAR'));
  if v_currency !~ '^[A-Z]{3}$' then
    v_currency := 'ZAR';
  end if;

  v_country := upper(nullif(new.raw_user_meta_data ->> 'country_code', ''));
  if v_country is not null and v_country !~ '^[A-Z]{2}$' then
    v_country := null;
  end if;

  insert into public.profiles (
    id,
    full_name,
    email,
    role,
    onboarding_status,
    preferred_currency,
    country_code
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'client'),
    'pending',
    v_currency,
    v_country
  );
  return new;
end;
$$;

-- Atomically links the Paddle transaction and its immutable FX quote. The
-- legacy attach_checkout_transaction function remains available during a
-- rolling deployment, but new code uses this richer variant.
create or replace function public.attach_localized_checkout_transaction(
  p_project_id uuid,
  p_transaction_id text,
  p_presentment_amount_minor bigint,
  p_presentment_currency text,
  p_requested_currency text,
  p_country_code text,
  p_fx_rate numeric,
  p_fx_source text,
  p_fx_quoted_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_deposit bigint;
  v_existing_transaction text;
begin
  select client_id, deposit_amount, paddle_transaction_id
  into v_client_id, v_deposit, v_existing_transaction
  from public.projects
  where id = p_project_id and status = 'awaiting_payment'
  for update;

  if v_client_id is null then
    raise exception 'Project is not awaiting payment';
  end if;
  if v_existing_transaction is not null and v_existing_transaction <> p_transaction_id then
    raise exception 'Project already has a different checkout transaction';
  end if;
  if p_presentment_amount_minor < 0 or p_fx_rate <= 0 then
    raise exception 'Invalid checkout FX quote';
  end if;

  update public.projects
  set
    paddle_transaction_id = p_transaction_id,
    payment_status = 'pending',
    client_currency = upper(p_requested_currency),
    client_country_code = upper(nullif(p_country_code, ''))
  where id = p_project_id;

  insert into public.payments (
    project_id,
    client_id,
    provider_transaction_id,
    kind,
    amount,
    currency,
    base_currency,
    presentment_amount_minor,
    presentment_currency,
    fx_rate,
    fx_source,
    fx_quoted_at,
    status
  ) values (
    p_project_id,
    v_client_id,
    p_transaction_id,
    'deposit',
    v_deposit,
    'ZAR',
    'ZAR',
    p_presentment_amount_minor,
    upper(p_presentment_currency),
    p_fx_rate,
    p_fx_source,
    p_fx_quoted_at,
    'pending'
  )
  on conflict (provider_transaction_id) do update
  set
    presentment_amount_minor = excluded.presentment_amount_minor,
    presentment_currency = excluded.presentment_currency,
    fx_rate = excluded.fx_rate,
    fx_source = excluded.fx_source,
    fx_quoted_at = excluded.fx_quoted_at;
end;
$$;

revoke all on function public.attach_localized_checkout_transaction(
  uuid, text, bigint, text, text, text, numeric, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.attach_localized_checkout_transaction(
  uuid, text, bigint, text, text, text, numeric, text, timestamptz
) to service_role;

comment on column public.projects.currency is
  'Canonical project accounting currency. Existing and new project values remain ZAR.';
comment on column public.payments.amount is
  'Canonical project amount in whole base-currency units; currently ZAR.';
comment on column public.payments.presentment_amount_minor is
  'Immutable buyer project-price subtotal in the lowest denomination of presentment_currency. Provider invoices remain the final record of tax and gross amount charged.';
comment on column public.talent_earnings.amount_owed is
  'Canonical talent allocation in whole base-currency units; currently ZAR.';
comment on column public.talent_earnings.payout_amount_minor is
  'Actual talent payout amount in the lowest denomination of payout_currency, locked when settled.';
