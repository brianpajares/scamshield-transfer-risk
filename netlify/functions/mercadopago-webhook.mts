import { createHmac, timingSafeEqual } from "node:crypto";
import { env, json, requireEnv } from "./_shared/http.mts";
import { supabaseInsert, supabasePatchByMatch } from "./_shared/supabase-rest.mts";

export default async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const missing = requireEnv(["MERCADOPAGO_ACCESS_TOKEN", "MERCADOPAGO_WEBHOOK_SECRET", "SUPABASE_URL"]);
  if (missing) return json({ error: missing }, 500);
  if (!env("SUPABASE_SECRET_KEY") && !env("SUPABASE_SERVICE_ROLE_KEY")) {
    return json({ error: "Missing server configuration: SUPABASE_SECRET_KEY" }, 500);
  }

  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") || url.searchParams.get("data_id") || "";
  const xSignature = req.headers.get("x-signature") || "";
  const xRequestId = req.headers.get("x-request-id") || "";

  if (!isValidMercadoPagoSignature({ xSignature, xRequestId, dataId })) {
    return json({ error: "Invalid signature" }, 401);
  }

  const event = await req.json().catch(() => ({}));
  const paymentId = event?.data?.id || dataId;

  let duplicateEvent = false;
  await supabaseInsert("payment_events", {
    provider: "mercadopago",
    provider_event_id: String(event.id || `${event.type || "payment"}:${paymentId}`),
    event_type: String(event.action || event.type || "payment"),
    payload: event
  }).catch((error) => {
    if (!String(error.message || "").includes("duplicate")) throw error;
    duplicateEvent = true;
  });

  if (duplicateEvent) return json({ received: true, duplicate: true });

  if (event.type === "payment" && paymentId) {
    const payment = await fetchPayment(paymentId);
    const approved = payment.status === "approved";
    const metadata = payment.metadata || {};
    const userId = metadata.user_id;
    const planId = metadata.plan_id;

    if (approved && userId && planId) {
      await supabasePatchByMatch("checkout_sessions", { idempotency_key: payment.external_reference }, {
        status: "completed",
        metadata: payment
      }).catch(() => null);

      await supabaseInsert("entitlements", {
        user_id: userId,
        plan_id: planId,
        status: "active",
        ends_at: planId === "PLUS" ? nextMonthIso() : null
      });
    }
  }

  return json({ received: true });
};

export const config = {
  path: "/api/mercadopago-webhook",
  method: ["POST"]
};

function isValidMercadoPagoSignature(input: { xSignature: string; xRequestId: string; dataId: string }) {
  const parts = Object.fromEntries(
    input.xSignature
      .split(",")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = [
    input.dataId ? `id:${input.dataId.toLowerCase()};` : "",
    input.xRequestId ? `request-id:${input.xRequestId};` : "",
    `ts:${ts};`
  ].join("");

  const expected = createHmac("sha256", env("MERCADOPAGO_WEBHOOK_SECRET")).update(manifest).digest("hex");
  return safeEqual(expected, v1);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function fetchPayment(paymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${env("MERCADOPAGO_ACCESS_TOKEN")}`
    }
  });
  if (!response.ok) throw new Error(`Mercado Pago payment lookup failed: ${response.status}`);
  return response.json();
}

function nextMonthIso() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}
