import { env, type Env } from "./http";

export async function getUserFromRequest(context: { env: Env }, request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;

  const response = await fetch(`${env(context, "SUPABASE_URL")}/auth/v1/user`, {
    headers: {
      apikey: env(context, "SUPABASE_PUBLISHABLE_KEY") || env(context, "SUPABASE_ANON_KEY"),
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) return null;
  return response.json();
}

export async function supabaseInsert(context: { env: Env }, table: string, payload: Record<string, unknown>) {
  const response = await fetch(`${env(context, "SUPABASE_URL")}/rest/v1/${table}`, {
    method: "POST",
    headers: serviceHeaders(context, { Prefer: "return=representation" }),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Supabase insert failed for ${table}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export async function supabasePatchByMatch(
  context: { env: Env },
  table: string,
  match: Record<string, string>,
  payload: Record<string, unknown>
) {
  const url = new URL(`${env(context, "SUPABASE_URL")}/rest/v1/${table}`);
  Object.entries(match).forEach(([key, value]) => url.searchParams.set(key, `eq.${value}`));

  const response = await fetch(url, {
    method: "PATCH",
    headers: serviceHeaders(context, { Prefer: "return=representation" }),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Supabase update failed for ${table}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

function getBearerToken(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

function serviceHeaders(context: { env: Env }, extra: Record<string, string> = {}) {
  const serviceKey = env(context, "SUPABASE_SECRET_KEY") || env(context, "SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...extra
  };
}
