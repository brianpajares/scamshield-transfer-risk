create table if not exists profiles (
  id uuid primary key,
  locale text default 'es',
  country text,
  consent_version text,
  marketing_opt_in boolean default false,
  created_at timestamptz default now()
);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  normalized_inputs jsonb not null,
  risk_score integer not null check (risk_score between 0 and 100),
  risk_level text not null check (risk_level in ('LOW', 'MEDIUM', 'HIGH')),
  confidence integer not null check (confidence between 0 and 100),
  model_version text not null,
  created_at timestamptz default now()
);

create table if not exists assessment_features (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  feature_key text not null,
  feature_value boolean not null,
  confidence integer,
  evidence_summary text
);

create table if not exists usage_counters (
  user_id uuid not null,
  period_key text not null,
  assessments_count integer default 0,
  pdf_count integer default 0,
  primary key (user_id, period_key)
);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists plans (
  id text primary key,
  name text not null,
  monthly_assessments integer not null,
  monthly_pdfs integer not null,
  active boolean default true
);

create table if not exists entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id text references plans(id),
  status text not null,
  starts_at timestamptz default now(),
  ends_at timestamptz
);

create table if not exists model_versions (
  version text primary key,
  manifest_hash text not null,
  status text not null,
  activated_at timestamptz,
  validation_summary jsonb
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  payload jsonb,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table assessments enable row level security;
alter table assessment_features enable row level security;
alter table usage_counters enable row level security;
alter table entitlements enable row level security;

create policy "profiles owner read" on profiles for select using (auth.uid() = id);
create policy "profiles owner update" on profiles for update using (auth.uid() = id);
create policy "assessments owner read" on assessments for select using (auth.uid() = user_id);
create policy "assessments owner insert" on assessments for insert with check (auth.uid() = user_id);
create policy "features through owned assessment" on assessment_features for select using (
  exists (select 1 from assessments a where a.id = assessment_id and a.user_id = auth.uid())
);
create policy "usage owner read" on usage_counters for select using (auth.uid() = user_id);
create policy "entitlements owner read" on entitlements for select using (auth.uid() = user_id);

insert into app_settings(key, value) values
  ('free_beta', '{"billing_enabled": false, "paywall_enabled": false, "beta_free_mode": true, "entitlement_engine_enabled": true}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
