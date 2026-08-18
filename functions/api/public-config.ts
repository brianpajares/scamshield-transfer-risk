import { env, json, type Env } from "../_shared/http";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  return json({
    supabaseUrl: env(context, "SUPABASE_URL"),
    supabasePublishableKey: env(context, "SUPABASE_PUBLISHABLE_KEY") || env(context, "SUPABASE_ANON_KEY"),
    mercadoPagoPublicKey: env(context, "MERCADOPAGO_PUBLIC_KEY"),
    billingEnabled: env(context, "BILLING_ENABLED") === "true",
    appUrl: env(context, "APP_URL", "https://escudo-transferencia.pages.dev")
  });
};
