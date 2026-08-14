import assert from "node:assert/strict";
import { redactPII, scoreAssessment } from "../src/engine/risk-engine.js";

const highRisk = {
  relationshipType: "online_recent",
  metInPerson: "no",
  paymentMethod: "crypto",
  storyType: "investment",
  amount: 2200,
  urgency: true,
  secrecy: true,
  requestedCodes: false,
  remoteAccess: false,
  independentVerification: "no",
  expectedPayment: "no",
  fundsConfirmed: "no",
  messageOptIn: true,
  message: "Es urgente, la ganancia es garantizada y debes pagar en crypto hoy."
};

const lowRisk = {
  relationshipType: "known_offline",
  metInPerson: "yes",
  paymentMethod: "credit_card",
  storyType: "other",
  amount: 25,
  urgency: false,
  secrecy: false,
  requestedCodes: false,
  remoteAccess: false,
  independentVerification: "yes",
  expectedPayment: "yes",
  fundsConfirmed: "yes",
  messageOptIn: false,
  message: ""
};

const highA = scoreAssessment(highRisk);
const highB = scoreAssessment(highRisk);
assert.equal(highA.riskScore, highB.riskScore, "same input and model must produce same score");
assert.equal(highA.riskLevel, "HIGH", "investment + crypto + pressure should be high");
assert.ok(highA.topFactors.length >= 3, "high result should explain top factors");
assert.ok(highA.matchedPatterns.some((pattern) => pattern.id === "PAT-INVESTMENT-CRYPTO"));

const low = scoreAssessment(lowRisk);
assert.equal(low.riskLevel, "LOW", "verified expected low-friction payment should be low");
assert.ok(low.protectiveFactors.length >= 3, "low result should show protective factors");
assert.equal(low.probabilityClaimAllowed, false, "v0.1.0 must not claim calibrated probability");

const pii = redactPII("Mi email es test@example.com y mi código 123456");
assert.ok(pii.redacted.includes("[EMAIL]"));
assert.ok(pii.findings.includes("email"));

console.log("risk-engine tests passed");
