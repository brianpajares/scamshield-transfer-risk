export default async () => {
  const config = {
    supabaseUrl: Netlify.env.get("SUPABASE_URL") || "",
    supabasePublishableKey:
      Netlify.env.get("SUPABASE_PUBLISHABLE_KEY") ||
      Netlify.env.get("SUPABASE_ANON_KEY") ||
      "",
    mercadoPagoPublicKey: Netlify.env.get("MERCADOPAGO_PUBLIC_KEY") || "",
    billingEnabled: Netlify.env.get("BILLING_ENABLED") === "true",
    appUrl: Netlify.env.get("APP_URL") || "https://escudo-transferencia.netlify.app"
  };

  return json(config);
};

export const config = {
  path: "/api/public-config",
  method: ["GET"]
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
