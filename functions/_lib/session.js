// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Shared helpers for client sessions. Files starting with an underscore
// are not routed by Cloudflare Pages Functions, safe to import from
// elsewhere without it becoming an accidental endpoint.

const SESSION_TTL_DAYS = 90;

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(env, clientId) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await env.WATAG_DB.prepare(`INSERT INTO client_sessions (client_id, token, expires_at) VALUES (?, ?, ?)`)
    .bind(clientId, token, expiresAt)
    .run();

  return token;
}

// returns a clientId if the request carries a valid, unexpired session token, otherwise null
export async function resolveClientSession(request, env) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  const row = await env.WATAG_DB.prepare(
    `SELECT client_id FROM client_sessions WHERE token = ? AND expires_at > datetime('now')`
  )
    .bind(token)
    .first();

  return row ? row.client_id : null;
}
