alter table profiles
  alter column id set default auth.uid();

drop policy if exists "profiles owner insert" on profiles;
create policy "profiles owner insert" on profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "assessments owner insert" on assessments;
create policy "assessments owner insert" on assessments
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create unique index if not exists entitlements_user_plan_active_idx
  on entitlements(user_id, plan_id)
  where status = 'active' and ends_at is null;

insert into prices(id, plan_id, provider, currency, amount_cents, interval, active) values
  ('full_report_pen_1490_seed', 'FULL_REPORT', 'mercadopago', 'PEN', 1490, 'one_time', false),
  ('plus_pen_2990_month_seed', 'PLUS', 'mercadopago', 'PEN', 2990, 'month', false)
on conflict (id) do update set
  plan_id = excluded.plan_id,
  provider = excluded.provider,
  currency = excluded.currency,
  amount_cents = excluded.amount_cents,
  interval = excluded.interval,
  active = excluded.active;

insert into app_settings(key, value) values
  ('integrations', '{
    "supabase_auth_enabled": true,
    "mercadopago_provider": "primary",
    "checkout_endpoint": "/api/create-checkout",
    "webhook_endpoint": "/api/mercadopago-webhook"
  }'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
