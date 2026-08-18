import assert from "node:assert/strict";
import { plans } from "../src/data/monetization-config.js";
import { createCheckoutPayload, evaluateAccess } from "../src/services/entitlements.js";
import { createPaymentProvider } from "../src/services/payment-provider.js";

assert.ok(plans.some((plan) => plan.id === "FREE_BETA_V1"));
assert.ok(plans.some((plan) => plan.id === "FULL_REPORT"));
assert.ok(plans.some((plan) => plan.id === "PLUS"));

const freeAccess = evaluateAccess({
  settings: { billing_enabled: false, paywall_enabled: false },
  usage: { assessments: 99, pdfs: 99 }
});
assert.equal(freeAccess.canAssess, true, "free beta should not hard paywall assessments");

const paidAccess = evaluateAccess({
  settings: { billing_enabled: true, paywall_enabled: true },
  planId: "FULL_REPORT",
  usage: { assessments: 1, pdfs: 1 }
});
assert.equal(paidAccess.canAssess, false, "paywall mode should enforce plan assessment limits");
assert.equal(paidAccess.canGeneratePdf, false, "paywall mode should enforce PDF limits");

const payload = createCheckoutPayload({ planId: "PLUS", userId: "user_1", assessmentId: "assessment_1" });
assert.equal(payload.mode, "subscription");
assert.match(payload.idempotencyKey, /^PLUS:user_1:assessment_1$/);
assert.equal(payload.successUrlPolicy.includes("Never grant access"), true);

const disabledProvider = createPaymentProvider({ billingEnabled: false, providerConfigured: false });
assert.equal(disabledProvider.createCheckoutSession({ planId: "PLUS" }).ok, false);

console.log("monetization tests passed");
