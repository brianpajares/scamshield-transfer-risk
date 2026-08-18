export const billingState = {
  billing_enabled: false,
  paywall_enabled: false,
  beta_free_mode: true,
  entitlement_engine_enabled: true,
  provider: "stripe_or_mercadopago",
  currency: "USD",
  go_live_gate: "Enable only after legal/commercial hosting/payment review."
};

export const plans = [
  {
    id: "FREE_BETA_V1",
    name: "Beta gratis",
    priceLabel: "US$0",
    interval: "durante beta",
    description: "Para validar utilidad y UX sin cobrar.",
    monthlyAssessments: 20,
    monthlyPdfs: 5,
    features: [
      "Risk Score LOW/MEDIUM/HIGH",
      "Explicacion de senales principales",
      "Historial local y PDF por impresion",
      "IA opcional desactivable"
    ],
    cta: "Activo ahora",
    disabled: true
  },
  {
    id: "FULL_REPORT",
    name: "Reporte completo",
    priceLabel: "US$3.99",
    interval: "pago unico",
    description: "Para usuarios que necesitan guardar evidencia y checklist completo.",
    monthlyAssessments: 1,
    monthlyPdfs: 1,
    features: [
      "Todos los factores y patrones",
      "Checklist de verificacion independiente",
      "PDF completo",
      "Reanalisis del caso guardado"
    ],
    cta: "Preparado para checkout",
    disabled: true
  },
  {
    id: "PLUS",
    name: "Plus",
    priceLabel: "US$8.99",
    interval: "mensual",
    description: "Para uso recurrente, familias o pequenos negocios.",
    monthlyAssessments: 100,
    monthlyPdfs: 30,
    features: [
      "Mayor cuota mensual",
      "Historial permanente con cuenta",
      "Reportes PDF ampliados",
      "Prioridad para nuevas funciones"
    ],
    cta: "Preparado para suscripcion",
    disabled: true
  }
];

export const monetizationEvents = [
  "pricing_viewed",
  "checkout_started",
  "checkout_completed",
  "checkout_failed",
  "entitlement_granted",
  "entitlement_revoked",
  "quota_reached"
];
