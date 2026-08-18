import { env } from "./http.mts";

export async function getUserFromRequest(req: Request) {
  const token = getBearerToken(req);
  if (!token) return null;

  const response = await fetch(`${env("SUPABASE_URL")}/auth/v1/user`, {
    headers: {
      apikey: env("SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_ANON_KEY"),
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) return null;
  return response.json();
}

export async function supabaseInsert(table: string, payload: Record<string, unknown>) {
  const response = await fetch(`${env("SUPABASE_URL")}/rest/v1/${table}`, {
    method: "POST",
    headers: serviceHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Supabase insert failed for ${table}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export async function supabasePatchByMatch(
  table: string,
  match: Record<string, string>,
  payload: Record<string, unknown>
) {
  const url = new URL(`${env("SUPABASE_URL")}/rest/v1/${table}`);
  Object.entries(match).forEach(([key, value]) => url.searchParams.set(key, `eq.${value}`));

  const response = await fetch(url, {
    method: "PATCH",
    headers: serviceHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Supabase update failed for ${table}: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

function serviceHeaders(extra: Record<string, string> = {}) {
  const serviceKey = env("SUPABASE_SECRET_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...extra
  };
}
