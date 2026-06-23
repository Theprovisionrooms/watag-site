// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/loyalty/qr-generate
// Called when a client opens their loyalty card screen.
// Returns a short lived, single use token to encode into the QR code.
// Token rotates every time this is called, so a screenshot of an old
// QR code cannot be reused to fake a stamp later.

const TOKEN_TTL_SECONDS = 60;

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }) {
  const { clientId } = await request.json();

  if (!clientId) {
    return new Response(JSON.stringify({ error: "clientId required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const token = randomToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();

  await env.WATAG_DB.prepare(
    `INSERT INTO qr_tokens (client_id, token, expires_at) VALUES (?, ?, ?)`
  )
    .bind(clientId, token, expiresAt)
    .run();

  return new Response(
    JSON.stringify({ token, expiresAt, ttlSeconds: TOKEN_TTL_SECONDS }),
    { headers: { "content-type": "application/json" } }
  );
}
