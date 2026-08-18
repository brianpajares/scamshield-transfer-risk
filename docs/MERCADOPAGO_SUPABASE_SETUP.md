# Activacion Mercado Pago + Supabase Auth

Fecha: 2026-08-18

Produccion actual: https://escudo-transferencia.netlify.app/

## Estado implementado

- Supabase Auth en frontend con registro, login, logout y sesion persistente.
- Guardado remoto de assessments para usuarios autenticados.
- API publica `/api/public-config` para exponer solo claves publicas.
- API privada `/api/create-checkout` para crear preferencias de Mercado Pago.
- Webhook `/api/mercadopago-webhook` con validacion HMAC `x-signature`.
- Registro idempotente de eventos en `payment_events`.
- Activacion de entitlements solo cuando Mercado Pago confirma `payment.status = approved`.

## Variables en Netlify

Ir a Netlify > `escudo-transferencia` > Site configuration > Environment variables.

Publicas:

- `APP_URL=https://escudo-transferencia.netlify.app`
- `SUPABASE_URL=<project-url>`
- `SUPABASE_PUBLISHABLE_KEY=<sb_publishable...>`
- `MERCADOPAGO_PUBLIC_KEY=<public-key>`

Secretas:

- `SUPABASE_SECRET_KEY=<sb_secret...>`
- `MERCADOPAGO_ACCESS_TOKEN=<access-token>`
- `MERCADOPAGO_WEBHOOK_SECRET=<webhook-secret>`

Activacion comercial:

- `BILLING_ENABLED=false` durante pruebas.
- Cambiar a `BILLING_ENABLED=true` solo despues de probar login, migraciones y webhook.

Ya deje configuradas en Netlify las variables no secretas:

- `APP_URL=https://escudo-transferencia.netlify.app`
- `PAYMENT_PROVIDER=mercadopago`
- `BILLING_ENABLED=false`

No usar secretos en `index.html`, `src/*`, GitHub ni mensajes de chat.

## Supabase

1. Crear proyecto Free.
2. Copiar Project URL y Publishable key.
3. Crear Secret key para backend.
4. Authentication > URL Configuration:
   - Site URL: `https://escudo-transferencia.netlify.app`
   - Redirect URL: `https://escudo-transferencia.netlify.app/**`
5. SQL Editor: aplicar migraciones en orden:
   - `database/migrations/0001_initial.sql`
   - `database/migrations/0002_monetization_readiness.sql`
   - `database/migrations/0003_auth_mercadopago_activation.sql`
6. Revisar RLS:
   - `profiles`: cada usuario lee/actualiza/inserta su perfil.
   - `assessments`: cada usuario lee/inserta sus evaluaciones.
   - `entitlements`: cada usuario lee sus planes.
   - `payment_events`: solo backend con secret key.

## Mercado Pago

1. Mercado Pago Developers > Tus integraciones.
2. Crear aplicacion `Escudo Transferencia`.
3. Copiar credenciales de prueba primero:
   - Public Key
   - Access Token
4. Webhooks > Configurar notificacion:
   - URL produccion: `https://escudo-transferencia.netlify.app/api/mercadopago-webhook`
   - Evento: `payment`
5. Revelar/copiar secret de webhook y guardarlo en Netlify como `MERCADOPAGO_WEBHOOK_SECRET`.
6. Probar pago con credenciales de prueba.
7. Activar credenciales de produccion cuando la prueba pase.

## Prueba de aceptacion

1. Abrir la app en produccion.
2. Ir a `Ingresar` y crear usuario.
3. Confirmar correo si Supabase lo exige.
4. Hacer una evaluacion y guardar.
5. Verificar fila en Supabase `assessments`.
6. En Netlify activar temporalmente:
   - `BILLING_ENABLED=true`
7. Ir a Planes y seleccionar `Reporte completo`.
8. Confirmar que redirige a Mercado Pago.
9. Simular pago aprobado.
10. Verificar:
   - `payment_events` tiene evento unico.
   - `checkout_sessions.status = completed`.
   - `entitlements.status = active`.

## Seguridad

- El browser solo recibe `SUPABASE_PUBLISHABLE_KEY` y `MERCADOPAGO_PUBLIC_KEY`.
- `SUPABASE_SECRET_KEY`, `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET` viven solo en Netlify.
- El acceso pagado nunca se desbloquea desde `success URL`.
- El webhook responde duplicados sin duplicar entitlements.
