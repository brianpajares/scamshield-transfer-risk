# Resumen experto de implementacion

## Producto

ScamShield Transfer Risk es una app de apoyo a decision antes de enviar dinero. Evalua informacion estructurada y texto opcional para producir un Risk Score deterministico, explicaciones y recomendaciones de verificacion.

## Principios implementados

- La IA no decide el score.
- El motor de riesgo es reproducible y versionado.
- Los claims evitan decir "seguro" o "fraude definitivo".
- El texto del mensaje es opcional y pasa por redaccion de PII.
- La monetizacion no bloquea alertas criticas de seguridad.

## Arquitectura actual

- Frontend estatico con HTML, CSS y JavaScript modular.
- Motor de riesgo en `src/engine/risk-engine.js`.
- Modelo seed configurable en `src/data/model-config.js`.
- Persistencia local para historial, settings y usage.
- Migraciones Supabase para estado operacional.
- Configuracion preparada para Vercel y Netlify.

## Monetizacion

La monetizacion quedo preparada pero apagada.

Se agregaron planes, precios seed, entitlements, checkout sessions y payment events. El diseno exige webhook verificado antes de conceder acceso pagado.

## Pendientes antes de cobrar

- Desplegar version publica definitiva en Netlify/Vercel.
- Aplicar migraciones Supabase.
- Crear productos/precios reales en Stripe o Mercado Pago.
- Configurar secretos server-side.
- Implementar ruta/funcion server-side de checkout.
- Implementar webhook verificado.
- Publicar terminos, privacidad, reembolsos y soporte.
- Activar `billing_enabled=true` solo despues de pruebas end-to-end.
