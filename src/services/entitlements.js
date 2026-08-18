import { billingState, plans } from "../data/monetization-config.js";

export function getActivePlan(planId = "FREE_BETA_V1") {
  return plans.find((plan) => plan.id === planId) || plans[0];
}

export function evaluateAccess({ settings, planId = "FREE_BETA_V1", usage = {} }) {
  const effectiveSettings = { ...billingState, ...settings };
  const plan = getActivePlan(planId);
  const assessmentsUsed = Number(usage.assessments || 0);
  const pdfsUsed = Number(usage.pdfs || 0);

  return {
    plan,
    billingEnabled: Boolean(effectiveSettings.billing_enabled),
    paywallEnabled: Boolean(effectiveSettings.paywall_enabled),
    canAssess: !effectiveSettings.paywall_enabled || assessmentsUsed < plan.monthlyAssessments,
    canGeneratePdf: !effectiveSettings.paywall_enabled || pdfsUsed < plan.monthlyPdfs,
    assessmentsRemaining: Math.max(0, plan.monthlyAssessments - assessmentsUsed),
    pdfsRemaining: Math.max(0, plan.monthlyPdfs - pdfsUsed),
    reason: effectiveSettings.billing_enabled
      ? "Billing is enabled; enforce entitlements from the operational database."
      : "Free beta is active; checkout buttons remain disabled."
  };
}

export function createCheckoutPayload({ planId, userId, assessmentId }) {
  const plan = getActivePlan(planId);
  return {
    provider: billingState.provider,
    planId: plan.id,
    userId,
    assessmentId,
    mode: plan.id === "PLUS" ? "subscription" : "payment",
    idempotencyKey: `${plan.id}:${userId || "anonymous"}:${assessmentId || "none"}`,
    successUrlPolicy: "Never grant access from success URL. Wait for verified webhook.",
    metadata: {
      source: "scamshield-transfer-risk",
      plan_name: plan.name
    }
  };
}
