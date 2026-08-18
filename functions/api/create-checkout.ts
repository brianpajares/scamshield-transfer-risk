import { env, json, requireEnv, type Env } from "../_shared/http";
import { getCheckoutPlan } from "../_shared/plans";
import { getUserFromRequest, supabaseInsert } from "../_shared/supabase-rest";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (env(context, "BILLING_ENABLED") !== "true") return json({ error: "Billing is disabled" }, 503);

  const missing = requireEnv(context, ["APP_URL", "MERCADOPAGO_ACCESS_TOKEN", "SUPABASE_URL"]);
  if (missing) return json({ error: missing }, 500);
  if (!env(context, "SUPABASE_PUBLISHABLE_KEY") && !env(context, "SUPABASE_ANON_KEY")) {
    return json({ error: "Missing server configuration: SUPABASE_PUBLISHABLE_KEY" }, 500);
  }
  if (!env(context, "SUPABASE_SECRET_KEY") && !env(context, "SUPABASE_SERVICE_ROLE_KEY")) {
    return json({ error: "Missing server configuration: SUPABASE_SECRET_KEY" }, 500);
  }

  const user = await getUserFromRequest(context, context.request);
  if (!user?.id) return json({ error: "Login required" }, 401);

  const input = await context.request.json().catch(() => ({}));
  const plan = getCheckoutPlan(String(input.planId || ""));
  if (!plan) return json({ error: "Invalid plan" }, 400);

  const appUrl = env(context, "APP_URL").replace(/\/$/, "");
  const idempotencyKey = `${plan.id}:${user.id}:${input.assessmentId || "none"}`;
  const preferencePayload = {
    items: [
      {
        title: plan.title,
        quantity: 1,
        currency_id: plan.currency,
        unit_price: plan.amount
      }
    ],
    external_reference: idempotencyKey,
    metadata: {
      user_id: user.id,
      plan_id: plan.id,
      assessment_id: input.assessmentId || null
    },
    back_urls: {
      success: `${appUrl}/?payment=success`,
      failure: `${appUrl}/?payment=failure`,
      pending: `${appUrl}/?payment=pending`
    },
    notification_url: `${appUrl}/api/mercadopago-webhook`,
    auto_return: "approved"
  };

  const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env(context, "MERCADOPAGO_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify(preferencePayload)
  });

  const preference = await mpResponse.json().catch(() => ({}));
  if (!mpResponse.ok) {
    return json({ error: "Mercado Pago checkout failed", details: preference }, 502);
  }

  await supabaseInsert(context, "checkout_sessions", {
    user_id: user.id,
    plan_id: plan.id,
    provider: "mercadopago",
    provider_session_id: preference.id,
    idempotency_key: idempotencyKey,
    status: "redirected",
    assessment_id: input.assessmentId || null,
    metadata: {
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point
    }
  });

  return json({
    provider: "mercadopago",
    preferenceId: preference.id,
    initPoint: preference.init_point || preference.sandbox_init_point
  });
};
