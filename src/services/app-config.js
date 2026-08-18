let cachedConfig;

export async function loadPublicConfig() {
  if (cachedConfig) return cachedConfig;
  try {
    const response = await fetch("/api/public-config", { cache: "no-store" });
    if (!response.ok) throw new Error("config unavailable");
    cachedConfig = await response.json();
  } catch {
    cachedConfig = {
      supabaseUrl: "",
      supabasePublishableKey: "",
      mercadoPagoPublicKey: "",
      billingEnabled: false,
      appUrl: window.location.origin
    };
  }
  return cachedConfig;
}
