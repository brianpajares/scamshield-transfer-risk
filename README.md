# Escudo Transferencia

Functional MVP generated from `PRD_ScamShield_Transfer_Risk_Master_FINAL.docx`.

Commercial brand for Peru: Escudo Transferencia. Repository name is kept as
`scamshield-transfer-risk` to preserve GitHub and deployment links.

## What is included

- Mobile-first assessment stepper.
- Deterministic risk engine with configurable seed weights and thresholds.
- Optional message analysis with local PII redaction.
- LOW / MEDIUM / HIGH result, score, confidence, top factors and protective factors.
- Verification recommendations and safety copy.
- Browser-local history dashboard.
- Admin screen for beta flags and model status.
- Supabase starter migration, `.env.example`, architecture notes and tests.
- Monetization-ready plan catalog in PEN, entitlement rules and payment-provider contract.
- Supabase Auth client integration and Netlify Functions for Mercado Pago checkout/webhook.

## Run locally

Start the local zero-dependency server:

```bash
npm run dev
```

Then open `http://localhost:4173`.

Run the deterministic engine tests:

```bash
npm test
```

## Production notes

The app currently uses a local seed model so it can run without secrets. For production, connect:

- Supabase Auth, RLS and usage counters.
- Google Drive model sync with manifest validation and rollback.
- Turnstile on sensitive endpoints.
- PostHog events.
- AI provider only for opt-in extraction after PII redaction.
- Payment adapter only after `billing_enabled=true` and commercial hosting/compliance are ready.

The scoring copy intentionally avoids fraud-probability claims until real outcomes and calibration exist.

See `docs/MONETIZATION.md` and `docs/FREE_OPERATIONS_PERU.md` for the go-live checklist,
payment activation sequence and Peru commercial plan.
See `docs/MERCADOPAGO_SUPABASE_SETUP.md` for the exact account-connection steps.

## Hosting

The repository includes both `vercel.json` and `netlify.toml`.

- Production Netlify URL: https://escudo-transferencia.netlify.app/
- Vercel: static deployment from the repository root.
- Netlify: publish directory `.` with no build command required.
- `npm run build` performs a production file check.

See `docs/DEPLOYMENT.md` for exact production settings.
