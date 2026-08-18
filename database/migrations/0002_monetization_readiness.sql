create table if not exists prices (
  id text primary key,
  plan_id text not null references plans(id),
  provider text not null check (provider in ('stripe', 'mercadopago')),
  provider_price_id text,
  currency text not null default 'USD',
  amount_cents integer not null check (amount_cents >= 0),
  interval text not null check (interval in ('one_time', 'month')),
  active boolean default false,
  created_at timestamptz default now()
);

create table if not exists provider_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null check (provider in ('stripe', 'mercadopago')),
  provider_customer_id text not null,
  created_at timestamptz default now(),
  unique(provider, provider_customer_id),
  unique(user_id, provider)
);

create table if not exists checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id text not null references plans(id),
  price_id text references prices(id),
  provider text not null check (provider in ('stripe', 'mercadopago')),
  provider_session_id text,
  idempotency_key text not null unique,
  status text not null default 'created' check (status in ('created', 'redirected', 'completed', 'expired', 'failed')),
  assessment_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'mercadopago')),
  provider_event_id text not null,
  event_type text not null,
  processed_at timestamptz,
  payload jsonb not null,
  created_at timestamptz default now(),
  unique(provider, provider_event_id)
);

alter table prices enable row level security;
alter table provider_customers enable row level security;
alter table checkout_sessions enable row level security;
alter table payment_events enable row level security;

create index if not exists assessments_user_id_idx on assessments(user_id);
create index if not exists assessment_features_assessment_id_idx on assessment_features(assessment_id);
create index if not exists usage_counters_user_id_idx on usage_counters(user_id);
create index if not exists entitlements_user_id_idx on entitlements(user_id);
create index if not exists provider_customers_user_id_idx on provider_customers(user_id);
create index if not exists checkout_sessions_user_id_idx on checkout_sessions(user_id);

grant select on app_settings, plans, prices to anon, authenticated;
grant select, insert, update on profiles, assessments, assessment_features, usage_counters, entitlements, provider_customers, checkout_sessions to authenticated;
grant select on model_versions to authenticated;

drop policy if exists "profiles owner read" on profiles;
drop policy if exists "profiles owner update" on profiles;
drop policy if exists "assessments owner read" on assessments;
drop policy if exists "assessments owner insert" on assessments;
drop policy if exists "features through owned assessment" on assessment_features;
drop policy if exists "usage owner read" on usage_counters;
drop policy if exists "entitlements owner read" on entitlements;

create policy "profiles owner read" on profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles owner update" on profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "assessments owner read" on assessments
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "assessments owner insert" on assessments
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "features through owned assessment" on assessment_features
  for select to authenticated
  using (
    exists (
      select 1 from assessments a
      where a.id = assessment_id
      and a.user_id = (select auth.uid())
    )
  );

create policy "usage owner read" on usage_counters
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "entitlements owner read" on entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "public active plans" on plans
  for select to anon, authenticated
  using (active = true);

create policy "public active prices" on prices
  for select to anon, authenticated
  using (active = true);

create policy "provider customers owner read" on provider_customers
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "checkout sessions owner read" on checkout_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

insert into plans(id, name, monthly_assessments, monthly_pdfs, active) values
  ('FREE_BETA_V1', 'Beta gratis', 20, 5, true),
  ('FULL_REPORT', 'Reporte completo', 1, 1, false),
  ('PLUS', 'Plus', 100, 30, false)
on conflict (id) do update set
  name = excluded.name,
  monthly_assessments = excluded.monthly_assessments,
  monthly_pdfs = excluded.monthly_pdfs,
  active = excluded.active;

insert into prices(id, plan_id, provider, currency, amount_cents, interval, active) values
  ('full_report_usd_399_seed', 'FULL_REPORT', 'stripe', 'USD', 399, 'one_time', false),
  ('plus_usd_899_month_seed', 'PLUS', 'stripe', 'USD', 899, 'month', false)
on conflict (id) do update set
  plan_id = excluded.plan_id,
  provider = excluded.provider,
  currency = excluded.currency,
  amount_cents = excluded.amount_cents,
  interval = excluded.interval,
  active = excluded.active;

insert into app_settings(key, value) values
  ('monetization', '{
    "billing_enabled": false,
    "paywall_enabled": false,
    "beta_free_mode": true,
    "entitlement_engine_enabled": true,
    "future_full_report_active": false,
    "future_plus_active": false,
    "provider": "stripe_or_mercadopago"
  }'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
