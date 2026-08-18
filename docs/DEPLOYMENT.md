# Production Deployment

The app is ready for static production hosting.

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

## Production Readiness Checklist

- `npm test` passes.
- `npm run build` passes.
- No secrets are committed.
- Billing and paywall flags remain off for free beta.
- The app does not claim calibrated fraud probability.
- Supabase, Drive, Turnstile, PostHog and AI keys are added only in the hosting provider dashboard when those integrations are enabled.
