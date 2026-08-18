import { loadPublicConfig } from "./app-config.js";

let clientPromise;

export async function getSupabaseClient() {
  if (clientPromise) return clientPromise;
  clientPromise = createClient();
  return clientPromise;
}

export async function getAuthSession() {
  const client = await getSupabaseClient();
  if (!client) return { client: null, session: null, user: null, configured: false };

  const { data } = await client.auth.getSession();
  return {
    client,
    session: data.session,
    user: data.session?.user || null,
    configured: true
  };
}

export async function signUpWithEmail(email, password) {
  const client = await getSupabaseClient();
  if (!client) throw new Error("Supabase no esta configurado.");
  return client.auth.signUp({ email, password });
}

export async function signInWithEmail(email, password) {
  const client = await getSupabaseClient();
  if (!client) throw new Error("Supabase no esta configurado.");
  return client.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const client = await getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function saveRemoteAssessment({ input, result }) {
  const { client, user } = await getAuthSession();
  if (!client || !user || !result) return { ok: false, reason: "auth_required" };

  const { error } = await client.from("assessments").insert({
    user_id: user.id,
    normalized_inputs: input,
    risk_score: result.riskScore,
    risk_level: result.riskLevel,
    confidence: result.confidence,
    model_version: result.modelVersion
  });

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

async function createClient() {
  const config = await loadPublicConfig();
  if (!config.supabaseUrl || !config.supabasePublishableKey) return null;

  const { createClient: createSupabaseClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  return createSupabaseClient(config.supabaseUrl, config.supabasePublishableKey);
}
