# Historial de modificaciones

Repositorio: https://github.com/brianpajares/scamshield-transfer-risk

Carpeta Drive maestra: ScamShield_Transfer_Risk

## 2026-08-18 - Integracion Auth y Mercado Pago

Commit: pendiente

- Se agrego Supabase Auth en frontend: registro, login, logout y sesion.
- Se agrego guardado remoto de assessments para usuarios autenticados.
- Se agrego funcion Netlify `/api/public-config`.
- Se agrego funcion Netlify `/api/create-checkout` para crear preferencias Mercado Pago.
- Se agrego webhook `/api/mercadopago-webhook` con validacion HMAC `x-signature`.
- Se agrego migracion `0003_auth_mercadopago_activation.sql`.
- Se agrego guia `docs/MERCADOPAGO_SUPABASE_SETUP.md`.

## 2026-08-18 - Produccion Netlify

Commit: `4ad28bb Document Netlify production deployment`

- Se creo el proyecto Netlify `escudo-transferencia`.
- Se desplego produccion en `https://escudo-transferencia.netlify.app/`.
- Se verifico respuesta HTTP `200 OK`.
- Se documento site ID `c70334b4-b8fd-47e9-955e-2cf860e95e09` y deploy ID `6a84bfe69a406c854dfe4ff5`.

## 2026-08-18 - Plan gratis y monetizacion Peru

Commit: `e4dc872 Add Peru free operations plan`

- Se definio nombre comercial en espanol: `Escudo Transferencia`.
- Se cambiaron los precios semilla a soles: `S/ 0`, `S/ 14.90`, `S/ 29.90`.
- Se fijo Mercado Pago como proveedor primario recomendado para Peru.
- Se agrego `docs/FREE_OPERATIONS_PERU.md` con stack de costo fijo cero, fuentes oficiales, estrategia de cobro y checklist de go-live.
- Se mantuvo el checkout bloqueado hasta tener proveedor real, secretos server-side y webhook verificado.

## 2026-08-18 - Capa de monetización

Commit: `eb0fa6b Add monetization readiness layer`

- Se agrego pantalla de planes en la app.
- Se agrego catalogo seed de planes: `FREE_BETA_V1`, `FULL_REPORT`, `PLUS`.
- Se agrego `src/services/entitlements.js` para reglas de acceso, cuotas y payload de checkout.
- Se agrego `src/services/payment-provider.js` como contrato de adapter para Stripe o Mercado Pago.
- Se agrego migracion `0002_monetization_readiness.sql` con `prices`, `provider_customers`, `checkout_sessions` y `payment_events`.
- Se agregaron pruebas `tests/monetization.test.js`.
- Se mantuvieron `billing_enabled=false` y `paywall_enabled=false` para evitar cobros accidentales.

Validacion:

- `risk-engine tests passed`
- `monetization tests passed`
- `Production build check passed`

## 2026-08-18 - Guia de despliegue

Commit: `d905cb9 Add production deployment guide`

- Se agrego `docs/DEPLOYMENT.md`.
- Se documento configuracion de Vercel y Netlify.

## 2026-08-18 - Preparacion de produccion

Commit: `c3fcbbf Prepare production deployment`

- Se agrego `vercel.json`.
- Se agrego `netlify.toml`.
- Se agrego `.gitignore`.
- Se agrego `scripts/build-check.mjs`.
- Se actualizo `package.json` con `npm run build`.

Validacion:

- `risk-engine tests passed`
- `Production build check passed`

## 2026-08-14 - MVP inicial

Commit: `82a32e3 Initial ScamShield Transfer Risk MVP`

- Se reviso el PRD `PRD_ScamShield_Transfer_Risk_Master_FINAL.docx`.
- Se creo MVP estatico funcional de ScamShield Transfer Risk.
- Se agrego assessment mobile-first.
- Se agrego motor deterministico de riesgo.
- Se agrego redaccion local de PII.
- Se agrego resultado explicable con senales, factores protectores, patrones y recomendaciones.
- Se agrego historial local, admin local, SQL base Supabase, documentacion y pruebas.

Validacion:

- `risk-engine tests passed`
- App local verificada por HTTP en `http://localhost:4173`.
