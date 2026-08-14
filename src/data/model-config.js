export const modelConfig = {
  modelVersion: "0.1.0-local-seed",
  probabilityClaimAllowed: false,
  updatedAt: "2026-08-14",
  source: "Seed model derived from PRD_ScamShield_Transfer_Risk_Master_FINAL.docx",
  thresholds: {
    lowMax: 39,
    mediumMax: 69
  },
  intercept: -2.15,
  weights: {
    new_relationship: 0.9,
    never_met_in_person: 1.05,
    urgency_pressure: 1.1,
    secrecy_request: 1.0,
    irreversible_payment: 1.3,
    crypto_payment: 1.25,
    gift_card_payment: 1.45,
    wire_payment: 0.95,
    verification_code_request: 1.7,
    remote_access_request: 1.65,
    move_money_to_protect_it: 1.75,
    guaranteed_return_claim: 1.55,
    fake_check_overpayment: 1.45,
    authority_impersonation: 1.15,
    marketplace_off_platform: 1.0,
    job_upfront_payment: 1.25,
    romance_context: 0.85,
    amount_high: 0.65,
    message_red_flags: 1.05,
    independent_verification_passed: -1.75,
    known_offline_relationship: -1.2,
    expected_payment_context: -1.0,
    reversible_credit_card: -0.8,
    actual_funds_confirmed: -1.1
  },
  featureCopy: {
    new_relationship: "Relación reciente o poco establecida",
    never_met_in_person: "No se han visto en persona",
    urgency_pressure: "Presión o plazo urgente",
    secrecy_request: "Solicitud de mantenerlo en secreto",
    irreversible_payment: "Método de pago difícil de revertir",
    crypto_payment: "Pago con criptoactivos",
    gift_card_payment: "Pago con gift cards",
    wire_payment: "Transferencia bancaria o giro",
    verification_code_request: "Pidieron códigos, OTP o credenciales",
    remote_access_request: "Pidieron acceso remoto al dispositivo",
    move_money_to_protect_it: "Pidieron mover dinero para protegerlo",
    guaranteed_return_claim: "Promesa de retorno garantizado",
    fake_check_overpayment: "Posible sobrepago o cheque falso",
    authority_impersonation: "Posible suplantación de autoridad o empresa",
    marketplace_off_platform: "Pago fuera de la plataforma",
    job_upfront_payment: "Pago requerido para trabajar",
    romance_context: "Contexto romántico o relación online",
    amount_high: "Monto alto para el contexto declarado",
    message_red_flags: "El mensaje contiene señales de presión o pago riesgoso",
    independent_verification_passed: "Verificación independiente realizada",
    known_offline_relationship: "Relación conocida fuera de internet",
    expected_payment_context: "Pago esperado o previamente acordado",
    reversible_credit_card: "Método de pago más reversible",
    actual_funds_confirmed: "Fondos confirmados por canal independiente"
  }
};

export const patterns = [
  {
    id: "PAT-ROMANCE-EMERGENCY",
    name: "Romance o emergencia emocional",
    match: ["romance_context", "new_relationship", "never_met_in_person", "urgency_pressure", "secrecy_request"],
    severity: "high"
  },
  {
    id: "PAT-INVESTMENT-CRYPTO",
    name: "Inversión con promesa de retorno",
    match: ["guaranteed_return_claim", "crypto_payment", "urgency_pressure"],
    severity: "high"
  },
  {
    id: "PAT-IMPERSONATION-PROTECT",
    name: "Suplantación con supuesto resguardo de dinero",
    match: ["authority_impersonation", "move_money_to_protect_it", "verification_code_request"],
    severity: "high"
  },
  {
    id: "PAT-MARKETPLACE-OFFPLATFORM",
    name: "Marketplace con pago fuera de plataforma",
    match: ["marketplace_off_platform", "irreversible_payment"],
    severity: "medium"
  },
  {
    id: "PAT-JOB-UPFRONT",
    name: "Oferta laboral con pago inicial",
    match: ["job_upfront_payment", "fake_check_overpayment"],
    severity: "medium"
  }
];

export const recommendations = {
  LOW: [
    "Verifica por un canal independiente antes de enviar dinero.",
    "No compartas códigos, claves ni documentos sensibles.",
    "Si aparece nueva presión o cambia el método de pago, vuelve a evaluar."
  ],
  MEDIUM: [
    "Pausa la transferencia y confirma la identidad por un canal que tú controles.",
    "Pide documentación verificable y revisa inconsistencias en cuentas, dominios o teléfonos.",
    "Prefiere métodos reversibles y evita salir de plataformas protegidas."
  ],
  HIGH: [
    "No envíes dinero todavía. Verifica la solicitud con una fuente independiente.",
    "No compartas OTP, claves, pantallas ni acceso remoto.",
    "Contacta a tu banco/plataforma o a la autoridad correspondiente si ya pagaste."
  ]
};
