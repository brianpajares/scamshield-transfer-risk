# Cloudflare Pages Deployment

Fecha: 2026-08-18

Objetivo: usar Cloudflare Pages como produccion principal y mantener Netlify como
respaldo.

## Estado del repo

El repositorio ya incluye:

- `functions/api/public-config.ts`
- `functions/api/create-checkout.ts`
- `functions/api/mercadopago-webhook.ts`
- `_headers`
- `_redirects`
- `wrangler.jsonc`
- `npm run build:cloudflare`

El build genera `.cloudflare-pages` con solo assets publicos. No publica `docs`,
`database`, `netlify`, ni archivos internos.

## Crear proyecto desde GitHub

1. Entrar a Cloudflare Dashboard.
2. Ir a **Workers & Pages**.
3. Crear aplicacion > **Pages**.
4. Elegir **Connect to Git**.
5. Conectar GitHub.
6. Seleccionar repo:
   `brianpajares/scamshield-transfer-risk`
7. Configurar:
   - Project name: `escudo-transferencia`
   - Production branch: `main`
   - Build command: `npm run build:cloudflare`
   - Build output directory: `.cloudflare-pages`
   - Root directory: `/`

## Variables y secretos

Cloudflare > Pages project > Settings > Variables and Secrets.

Variables publicas:

- `APP_URL=https://escudo-transferencia.pages.dev`
- `PAYMENT_PROVIDER=mercadopago`
- `BILLING_ENABLED=false`
- `SUPABASE_URL=https://ynampgzehrhysnygjsga.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY=<publishable key>`
- `SUPABASE_ANON_KEY=<anon key>`
- `MERCADOPAGO_PUBLIC_KEY=<public key>`

Secretos cifrados:

- `SUPABASE_SECRET_KEY=<secret key>`
- `MERCADOPAGO_ACCESS_TOKEN=<access token>`
- `MERCADOPAGO_WEBHOOK_SECRET=<webhook secret>`

No pegar secretos en GitHub ni en chat.

## Mercado Pago

Cuando Cloudflare publique, actualizar el webhook principal en Mercado Pago:

`https://escudo-transferencia.pages.dev/api/mercadopago-webhook`

Evento:

- `payment`

Mantener Netlify como respaldo:

`https://escudo-transferencia.netlify.app/api/mercadopago-webhook`

## CLI opcional

Wrangler necesita un token para desplegar en modo no interactivo.

Comando esperado:

```bash
npx wrangler pages deploy .cloudflare-pages --project-name escudo-transferencia --branch main
```

Si quieres que yo lo haga desde CLI, crea un Cloudflare API Token con permisos
para Pages y configuralo localmente como `CLOUDFLARE_API_TOKEN`. No lo pegues
en GitHub.

## Verificacion

Despues del deploy:

1. Abrir `https://escudo-transferencia.pages.dev`.
2. Probar `/api/public-config`.
3. Confirmar que `supabaseUrl` aparece y `billingEnabled=false`.
4. Crear usuario en `Ingresar`.
5. Guardar assessment y verificar en Supabase.
6. Probar checkout solo cuando los secretos esten puestos.
7. Cambiar `BILLING_ENABLED=true` solo despues de prueba de pago aprobada.

## Fuentes oficiales

- Cloudflare Pages: https://pages.cloudflare.com/
- Cloudflare Pages Functions TypeScript: https://developers.cloudflare.com/pages/functions/typescript/
- Cloudflare Pages variables/secrets: https://developers.cloudflare.com/pages/functions/bindings/
- Wrangler Pages deploy: https://developers.cloudflare.com/workers/wrangler/commands/pages/
