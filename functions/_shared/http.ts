export interface Env {
  APP_URL?: string;
  BILLING_ENABLED?: string;
  MERCADOPAGO_ACCESS_TOKEN?: string;
  MERCADOPAGO_PUBLIC_KEY?: string;
  MERCADOPAGO_WEBHOOK_SECRET?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_URL?: string;
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export function env(context: { env: Env }, name: keyof Env, fallback = "") {
  return context.env[name] || fallback;
}

export function requireEnv(context: { env: Env }, names: Array<keyof Env>) {
  const missing = names.filter((name) => !env(context, name));
  if (missing.length) {
    return `Missing server configuration: ${missing.join(", ")}`;
  }
  return "";
}
