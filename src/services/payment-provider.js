import { createCheckoutPayload } from "./entitlements.js";

export function createPaymentProvider({ billingEnabled, providerConfigured }) {
  return {
    createCheckoutSession(input) {
      const payload = createCheckoutPayload(input);

      if (!billingEnabled || !providerConfigured) {
        return {
          ok: false,
          status: "disabled",
          payload,
          message: "Checkout is intentionally disabled until billing_enabled=true and provider secrets are configured server-side."
        };
      }

      return {
        ok: true,
        status: "ready_for_server_checkout",
        payload,
        message: "Send this payload to the server checkout route. The browser must never hold provider secret keys."
      };
    },
    handleWebhookContract() {
      return {
        required: [
          "Verify provider signature against raw request body.",
          "Reject duplicate event_id through payment_events unique constraint.",
          "Create or update entitlement only after confirmed payment event.",
          "Record provider customer/subscription IDs server-side.",
          "Never unlock paid access from a redirect or success URL."
        ]
      };
    }
  };
}
