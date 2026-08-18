import { env, json, requireEnv, type Env } from "../_shared/http";
import { supabaseInsert, supabasePatchByMatch } from "../_shared/supabase-rest";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const missing = requireEnv(context, ["MERCADOPAGO_ACCESS_TOKEN", "MERCADOPAGO_WEBHOOK_SECRET", "SUPABASE_URL"]);
  if (missing) return json({ error: missing }, 500);
  if (!env(context, "SUPABASE_SECRET_KEY") && !env(context, "SUPABASE_SERVICE_ROLE_KEY")) {
    return json({ error: "Missing server configuration: SUPABASE_SECRET_KEY" }, 500);
  }

  const url = new URL(context.request.url);
  const dataId = url.searchParams.get("data.id") || url.searchParams.get("data_id") || "";
  const xSignature = context.request.headers.get("x-signature") || "";
  const xRequestId = context.request.headers.get("x-request-id") || "";

  if (!(await isValidMercadoPagoSignature(context, { xSignature, xRequestId, dataId }))) {
    return json({ error: "Invalid signature" }, 401);
  }

  const event = await context.request.json().catch(() => ({}));
  const paymentId = event?.data?.id || dataId;
  let duplicateEvent = false;

  await supabaseInsert(context, "payment_events", {
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
    const payment = await fetchPayment(context, paymentId);
    const approved = payment.status === "approved";
    const metadata = payment.metadata || {};
    const userId = metadata.user_id;
    const planId = metadata.plan_id;

    if (approved && userId && planId) {
      await supabasePatchByMatch(context, "checkout_sessions", { idempotency_key: payment.external_reference }, {
        status: "completed",
        metadata: payment
      }).catch(() => null);

      await supabaseInsert(context, "entitlements", {
        user_id: userId,
        plan_id: planId,
        status: "active",
        ends_at: planId === "PLUS" ? nextMonthIso() : null
      });
    }
  }

  return json({ received: true });
};

async function isValidMercadoPagoSignature(
  context: { env: Env },
  input: { xSignature: string; xRequestId: string; dataId: string }
) {
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

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env(context, "MERCADOPAGO_WEBHOOK_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  return bytesToHex(new Uint8Array(signature)) === v1;
}

async function fetchPayment(context: { env: Env }, paymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${env(context, "MERCADOPAGO_ACCESS_TOKEN")}`
    }
  });
  if (!response.ok) throw new Error(`Mercado Pago payment lookup failed: ${response.status}`);
  return response.json();
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function nextMonthIso() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}
