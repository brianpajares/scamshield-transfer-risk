export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export function env(name: string, fallback = "") {
  return Netlify.env.get(name) || fallback;
}

export function requireEnv(names: string[]) {
  const missing = names.filter((name) => !env(name));
  if (missing.length) {
    return `Missing server configuration: ${missing.join(", ")}`;
  }
  return "";
}
