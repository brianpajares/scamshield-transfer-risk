# Monetization Readiness

Escudo Transferencia is now prepared for monetization, but billing remains disabled by design.

## Current Commercial State

- `billing_enabled=false`
- `paywall_enabled=false`
- `beta_free_mode=true`
- Checkout buttons are present but disabled until provider secrets and flags are configured.
- Paid access is never granted by a success URL. It must come from a verified webhook.

## Plans

| Plan | Type | Seed price | Purpose |
| --- | --- | ---: | --- |
| FREE_BETA_V1 | Free beta | S/ 0 | Validate UX and usage without charging. |
| FULL_REPORT | One-time | S/ 14.90 | Unlock full report, checklist and PDF for one case. |
| PLUS | Subscription | S/ 29.90/month | Higher quota, history and repeated use. |

Prices are seed assumptions for Peru. Keep final prices in the operational database/provider dashboard, not hardcoded in product logic.

See also `docs/FREE_OPERATIONS_PERU.md` for the zero-fixed-cost operating plan and Peru payment strategy.

## Architecture Added

- `src/data/monetization-config.js`: plan catalog, commercial flags and analytics events.
- `src/services/entitlements.js`: access, quota and checkout payload rules.
- `src/services/payment-provider.js`: provider adapter contract for Stripe or Mercado Pago.
- `database/migrations/0002_monetization_readiness.sql`: prices, provider customers, checkout sessions, payment events and RLS.
- `tests/monetization.test.js`: entitlement and checkout-contract tests.

## Provider Flow

1. User selects a plan.
2. Server creates checkout session with an idempotency key.
3. User pays in Stripe/Mercado Pago.
4. Provider sends webhook.
5. Server verifies webhook signature from the raw request body.
6. Server stores `payment_events(provider, provider_event_id)` with a unique constraint.
7. Server grants or updates entitlement only after the verified event.
8. Client refreshes entitlements from Supabase.

## Go-Live Gates

Do not enable billing until all are true:

- Hosting plan permits commercial production use.
- Payment provider account is verified and in live mode.
- `STRIPE_WEBHOOK_SECRET` or `MERCADOPAGO_WEBHOOK_SECRET` is configured server-side.
- Supabase migrations are applied and RLS policies are verified.
- Terms, privacy policy, refund policy and support contact are published.
- Analytics event checks confirm checkout start, completion, failure and entitlement grant.
- Test webhooks prove duplicate events do not create duplicate entitlements.

## Activation Steps

1. Apply database migrations.
2. Create provider products/prices and copy provider IDs into `prices.provider_price_id`.
3. Set provider secrets in Vercel/Netlify/Supabase Edge Functions, never in frontend code.
4. Implement the server checkout route or Edge Function.
5. Implement the verified webhook route or Edge Function.
6. Switch `future_full_report_active=true` and/or `future_plus_active=true`.
7. Switch `billing_enabled=true`.
8. Switch `paywall_enabled=true` only after monitoring confirms the flow works.

## Safety Principle

Critical security recommendations must remain visible in free mode. Paid plans can add depth, persistence and convenience, but should not hide urgent safety warnings.
