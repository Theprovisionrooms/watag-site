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

// staff sessions, same shape as client sessions, separate table so a
// leaked client token can never be replayed as a staff one or vice versa
export async function createStaffSession(env, staffId) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await env.WATAG_DB.prepare(`INSERT INTO staff_sessions (staff_id, token, expires_at) VALUES (?, ?, ?)`)
    .bind(staffId, token, expiresAt)
    .run();

  return token;
}

// returns a staffId if the request carries a valid, unexpired staff
// session token, otherwise null. This is the only thing that should be
// trusted for "who is this staff member", never a staffId handed to us
// in the request body or query string, that's spoofable by anyone with
// devtools open.
export async function resolveStaffSession(request, env) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  const row = await env.WATAG_DB.prepare(
    `SELECT staff_id FROM staff_sessions WHERE token = ? AND expires_at > datetime('now')`
  )
    .bind(token)
    .first();

  return row ? row.staff_id : null;
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

// works out whether the caller is a signed-in client or a signed-in
// staff member, both now backed by a real verified session token,
// nothing here trusts an id the request just claims to be
export async function resolveViewer(request, env) {
  const clientId = await resolveClientSession(request, env);
  if (clientId) return { type: "client", id: clientId };

  const staffId = await resolveStaffSession(request, env);
  if (staffId) return { type: "staff", id: staffId };

  return null;
}

export async function isOwner(env, staffId) {
  if (!staffId) return false;
  const staff = await env.WATAG_DB.prepare(`SELECT role FROM staff WHERE id = ?`).bind(staffId).first();
  return staff?.role === "owner";
}

export async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, "0")).join("");
}
