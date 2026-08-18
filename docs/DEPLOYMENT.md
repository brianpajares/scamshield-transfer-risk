# Production Deployment

The app is ready for static production hosting.

Current production URL: https://escudo-transferencia.netlify.app/

Netlify project: https://app.netlify.com/projects/escudo-transferencia

Last verified HTTP status: `200 OK` on 2026-08-18.

## Vercel

Project settings:

- Framework preset: Other
- Build command: `npm run build`
- Output directory: `.`
- Install command: none required
- Root directory: repository root

Deploy:

```bash
vercel --prod
```

The included `vercel.json` adds SPA fallback routing and security headers.

## Netlify

Project settings:

- Build command: empty
- Publish directory: `.`
- Base directory: repository root

Deploy:

```bash
netlify deploy --prod --dir .
```

The included `netlify.toml` adds SPA fallback routing and security headers.

Current site ID: `c70334b4-b8fd-47e9-955e-2cf860e95e09`

Current deploy ID: `6a84bfe69a406c854dfe4ff5`

## Production Readiness Checklist

- `npm test` passes.
- `npm run build` passes.
- No secrets are committed.
- Billing and paywall flags remain off for free beta.
- The app does not claim calibrated fraud probability.
- Supabase, Drive, Turnstile, PostHog and AI keys are added only in the hosting provider dashboard when those integrations are enabled.

## Required Env Vars For Auth And Payments

- `APP_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `MERCADOPAGO_PUBLIC_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `BILLING_ENABLED`

Keep `BILLING_ENABLED=false` until Supabase migrations and Mercado Pago webhooks are verified.
