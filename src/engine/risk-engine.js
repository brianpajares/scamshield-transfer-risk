import { modelConfig, patterns, recommendations } from "../data/model-config.js";

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

export function redactPII(text = "") {
  const findings = [];
  let redacted = text;
  const rules = [
    { id: "email", label: "email", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, mask: "[EMAIL]" },
    { id: "otp", label: "OTP/código", regex: /\b(?:otp|c[oó]digo|clave|pin)\s*[:#-]?\s*\d{4,8}\b/gi, mask: "[CODIGO]" },
    { id: "card", label: "tarjeta/cuenta larga", regex: /\b(?:\d[ -]?){13,19}\b/g, mask: "[NUMERO]" },
    { id: "phone", label: "teléfono", regex: /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}/g, mask: "[TELEFONO]" }
  ];

  for (const rule of rules) {
    if (rule.regex.test(redacted)) {
      findings.push(rule.label);
      redacted = redacted.replace(rule.regex, rule.mask);
    }
  }

  return { redacted, findings: [...new Set(findings)] };
}

export function extractMessageFeatures(text = "") {
  const lower = text.toLowerCase();
  const hasAny = (words) => words.some((word) => lower.includes(word));
  return {
    urgency_pressure: hasAny(["urgente", "ahora", "ya mismo", "deadline", "última oportunidad", "ultimo aviso"]),
    secrecy_request: hasAny(["no le digas", "secreto", "confidencial", "no cuentes"]),
    verification_code_request: hasAny(["otp", "código", "codigo", "clave", "pin", "token"]),
    remote_access_request: hasAny(["anydesk", "teamviewer", "acceso remoto", "control remoto"]),
    move_money_to_protect_it: hasAny(["mueve tu dinero", "proteger tu dinero", "cuenta segura", "bloqueo preventivo"]),
    guaranteed_return_claim: hasAny(["garantizado", "sin riesgo", "retorno fijo", "duplicar", "ganancia segura"]),
    gift_card_payment: hasAny(["gift card", "tarjeta regalo", "steam", "itunes", "google play"]),
    crypto_payment: hasAny(["bitcoin", "crypto", "cripto", "usdt", "binance"]),
    fake_check_overpayment: hasAny(["cheque", "sobrepago", "devuélveme la diferencia", "devuelveme la diferencia"]),
    marketplace_off_platform: hasAny(["fuera de la app", "por fuera", "no uses la plataforma"]),
    message_red_flags: hasAny(["urgente", "secreto", "otp", "código", "gift card", "crypto", "garantizado", "acceso remoto"])
  };
}

export function normalizeAssessment(input) {
  const amount = Number(input.amount || 0);
  const payment = input.paymentMethod || "bank_transfer";
  const story = input.storyType || "other";
  const relationship = input.relationshipType || "unknown";
  const message = input.message || "";
  const messageFeatures = input.messageOptIn ? extractMessageFeatures(message) : {};

  const features = {
    new_relationship: ["online_recent", "unknown", "new_contact"].includes(relationship),
    never_met_in_person: input.metInPerson === "no",
    urgency_pressure: Boolean(input.urgency) || messageFeatures.urgency_pressure,
    secrecy_request: Boolean(input.secrecy) || messageFeatures.secrecy_request,
    irreversible_payment: ["wire", "crypto", "gift_card", "cash_app", "yape_plin"].includes(payment),
    crypto_payment: payment === "crypto" || messageFeatures.crypto_payment,
    gift_card_payment: payment === "gift_card" || messageFeatures.gift_card_payment,
    wire_payment: payment === "wire" || payment === "bank_transfer",
    verification_code_request: Boolean(input.requestedCodes) || messageFeatures.verification_code_request,
    remote_access_request: Boolean(input.remoteAccess) || messageFeatures.remote_access_request,
    move_money_to_protect_it: story === "protect_money" || messageFeatures.move_money_to_protect_it,
    guaranteed_return_claim: story === "investment" || messageFeatures.guaranteed_return_claim,
    fake_check_overpayment: story === "overpayment" || messageFeatures.fake_check_overpayment,
    authority_impersonation: story === "authority" || story === "bank",
    marketplace_off_platform: story === "marketplace" || messageFeatures.marketplace_off_platform,
    job_upfront_payment: story === "job",
    romance_context: story === "romance",
    amount_high: amount >= 1000,
    message_red_flags: Boolean(messageFeatures.message_red_flags),
    independent_verification_passed: input.independentVerification === "yes",
    known_offline_relationship: relationship === "known_offline",
    expected_payment_context: input.expectedPayment === "yes",
    reversible_credit_card: payment === "credit_card",
    actual_funds_confirmed: input.fundsConfirmed === "yes"
  };

  return Object.fromEntries(Object.entries(features).map(([key, value]) => [key, Boolean(value)]));
}

export function scoreAssessment(input, config = modelConfig) {
  const features = normalizeAssessment(input);
  let z = config.intercept;
  const contributions = [];

  for (const [feature, active] of Object.entries(features)) {
    if (!active) continue;
    const weight = config.weights[feature] || 0;
    z += weight;
    contributions.push({
      feature,
      weight,
      label: config.featureCopy[feature] || feature,
      type: weight < 0 ? "protective" : "risk"
    });
  }

  const raw = sigmoid(z);
  const riskScore = Math.max(0, Math.min(100, Math.round(raw * 100)));
  const riskLevel = riskScore <= config.thresholds.lowMax ? "LOW" : riskScore <= config.thresholds.mediumMax ? "MEDIUM" : "HIGH";
  const topFactors = contributions
    .filter((item) => item.type === "risk")
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 5);
  const protectiveFactors = contributions
    .filter((item) => item.type === "protective")
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  const matchedPatterns = matchPatterns(features);
  const confidence = calculateConfidence(input, contributions.length, matchedPatterns.length);

  return {
    assessmentId: cryptoSafeId(),
    riskScore,
    riskLevel,
    confidence,
    topFactors,
    protectiveFactors,
    matchedPatterns,
    modelVersion: config.modelVersion,
    probabilityClaimAllowed: config.probabilityClaimAllowed,
    recommendations: recommendations[riskLevel],
    createdAt: new Date().toISOString(),
    features
  };
}

export function matchPatterns(features) {
  return patterns
    .map((pattern) => {
      const hits = pattern.match.filter((feature) => features[feature]);
      return {
        ...pattern,
        score: Math.round((hits.length / pattern.match.length) * 100),
        hits
      };
    })
    .filter((pattern) => pattern.score >= 50)
    .sort((a, b) => b.score - a.score);
}

function calculateConfidence(input, activeFeatureCount, patternCount) {
  let confidence = 46;
  if (input.relationshipType) confidence += 8;
  if (input.paymentMethod) confidence += 8;
  if (input.storyType) confidence += 8;
  if (input.amount) confidence += 6;
  if (input.messageOptIn && input.message) confidence += 10;
  confidence += Math.min(10, activeFeatureCount * 1.5);
  confidence += Math.min(6, patternCount * 2);
  return Math.max(35, Math.min(96, Math.round(confidence)));
}

function cryptoSafeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `assessment_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
