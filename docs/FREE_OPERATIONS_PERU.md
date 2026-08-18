# Operacion gratis y monetizacion en Peru

Fecha: 2026-08-18

Nombre comercial recomendado: Escudo Transferencia.

## Respuesta corta

Si, se puede dejar funcionando en modo beta casi gratis usando cuotas gratuitas:
Netlify para hosting estatico, Supabase Free para Auth/RLS/base de datos,
PostHog Free para eventos, Google Drive API para modelo/configuracion y Cloudflare
Turnstile para proteccion anti-bot.

No existe cobro a clientes con costo operativo totalmente cero: cuando recibes pagos,
el proveedor de pagos cobra comision y puede haber obligaciones tributarias/legales.
La meta correcta es operar la beta con S/ 0 de costo fijo y pagar comisiones solo
cuando ya haya ventas.

## Stack recomendado de bajo costo

| Necesidad | Opcion recomendada | Costo inicial | Nota operativa |
| --- | --- | ---: | --- |
| Hosting publico | Netlify Free | S/ 0 | Mejor para publicar comercialmente sin servidor propio mientras el trafico sea bajo. |
| Auth, RLS, datos | Supabase Free | S/ 0 | Usar RLS en todas las tablas expuestas y no exponer `service_role`. |
| Analytics | PostHog Free | S/ 0 | Medir activaciones, conversion a checkout, abandono y resultado de riesgo. |
| Modelo/config | Google Drive API | S/ 0 bajo cuota | Usar manifest versionado, cache local y rollback para no leer Drive en cada visita. |
| Anti-abuso | Cloudflare Turnstile Free | S/ 0 | Agregar en endpoints sensibles: analisis, checkout, soporte. |
| IA opcional | Desactivada por defecto | S/ 0 | Activar solo con opt-in y presupuesto; el motor deterministico ya funciona sin IA. |
| Pagos Peru | Mercado Pago primero | Sin costo fijo tipico | Habra comision por transaccion; usar webhook verificado antes de dar acceso. |

Fuentes oficiales revisadas:

- Supabase Free: https://supabase.com/pricing
- Supabase billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Netlify Free: https://www.netlify.com/pricing/
- Vercel Hobby: https://vercel.com/pricing y https://vercel.com/docs/plans/hobby
- PostHog Free: https://posthog.com/pricing
- Google Drive API limits/pricing: https://developers.google.com/workspace/drive/api/guides/limits
- Cloudflare Turnstile Free: https://developers.cloudflare.com/turnstile/plans/
- Mercado Pago Peru Checkout API: https://www.mercadopago.com.pe/developers/es/docs/checkout-api-payments/overview
- Stripe global availability: https://stripe.com/global

## Decision para Peru

Usar Mercado Pago como proveedor primario porque opera en Peru y tiene flujo de
Checkout API con notificaciones de pago. Mantener Stripe como adapter tecnico
secundario, pero no asumirlo para Peru: la disponibilidad de Stripe depende del
pais de la entidad/cuenta y debe verificarse antes de vender.

Para comenzar sin costo fijo:

1. Beta gratis con limite razonable por usuario.
2. Cobro manual opcional por Yape/Plin solo para pilotos B2B o soporte premium.
3. Checkout automatico con Mercado Pago cuando haya senales de demanda.
4. No activar `paywall_enabled=true` hasta probar webhooks en modo produccion.

## Precios semilla en soles

| Plan | Precio | Cliente ideal | Promesa vendible |
| --- | ---: | --- | --- |
| Beta gratis | S/ 0 | Usuarios tempranos | Revisar antes de transferir y recibir recomendaciones basicas. |
| Reporte completo | S/ 14.90 por caso | Personas que van a enviar dinero | PDF, checklist, factores completos y evidencia guardada. |
| Plus | S/ 29.90 mensual | Familias, freelancers, pequenos comercios | Mas casos, historial, reportes y soporte prioritario. |
| B2B Piloto | S/ 149-299 mensual | Negocios que reciben/validan pagos | Dashboard, casos compartidos y capacitacion inicial. |

Estos precios son de arranque para validar disposicion de pago. Deben ajustarse
con entrevistas y conversion real, no por intuicion.

## Embudo para conseguir clientes que paguen

1. Publicar una landing simple con el producto como primera pantalla, no pagina
   corporativa larga.
2. Crear 10 ejemplos SEO: "me piden transferencia por WhatsApp", "senales de
   estafa por marketplace", "como validar una cuenta antes de depositar".
3. TikTok/Reels/Shorts con casos de 30 segundos: "antes de transferir, pega el
   mensaje y revisa estas senales".
4. Ofrecer a comercios y comunidades un piloto gratuito de 14 dias.
5. Pedir testimonio y caso real anonimo despues de cada caso util.
6. Activar pago solo para PDF completo, historial y mayor cuota; dejar alertas
   urgentes gratis por responsabilidad de seguridad.

## Checklist para estar operativo sin gastar

- Netlify conectado a GitHub y publicado desde `main`.
- Variables publicas configuradas solo si se usan: Supabase URL/key publicable,
  PostHog key publicable y Turnstile site key.
- Secretos solo del lado servidor: Mercado Pago access token, webhook secret,
  Supabase service role si se usa en funciones.
- Migraciones `database/migrations/*.sql` aplicadas en Supabase.
- RLS revisado: cada usuario solo ve sus assessments, entitlements y eventos.
- PostHog recibe eventos: `pricing_viewed`, `checkout_started`,
  `checkout_completed`, `entitlement_granted`, `quota_reached`.
- DriveModelLoader valida manifest, usa cache y puede volver a la version previa.
- Politica de privacidad, terminos, soporte y politica de reembolso publicados.
- Webhook de pago probado contra eventos duplicados antes de desbloquear acceso.

## Riesgos que no conviene esconder

- Si empieza a crecer, el plan gratis puede quedarse corto por trafico, MAU,
  egress, eventos o base de datos.
- Vercel Hobby se orienta a uso personal/no comercial; para monetizar, Netlify
  Free o un plan comercial de Vercel/Netlify debe revisarse contra terminos
  vigentes.
- El producto no debe prometer "deteccion garantizada de estafa". Debe vender
  reduccion de riesgo, checklist y mejor decision antes de transferir.
- Para operar formalmente en Peru, revisar comprobantes, impuestos, proteccion
  de datos personales y terminos con un contador/abogado local.

## Siguiente hito tecnico

Prioridad 1: publicar Netlify desde GitHub.

Prioridad 2: crear Supabase Free y aplicar migraciones.

Prioridad 3: activar PostHog y Turnstile.

Prioridad 4: implementar Mercado Pago con webhook verificado en funcion serverless.

Prioridad 5: activar `billing_enabled=true` solo despues de una compra real de prueba.
