// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/clients/access
// Body: { name, phone }
// Phone is the identifier, not a security boundary, this is a profile
// not a bank account. If the phone's already known, returns that
// client's id. If not, creates a new profile.

function normalizePhone(phone) {
  return phone.replace(/[^0-9+]/g, "");
}

export async function onRequestPost({ request, env }) {
  const { name, phone } = await request.json();

  if (!phone || phone.trim().length < 7) {
    return new Response(JSON.stringify({ error: "a valid phone number is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const cleanPhone = normalizePhone(phone);

  const existing = await env.WATAG_DB.prepare(`SELECT id, name FROM clients WHERE phone = ?`)
    .bind(cleanPhone)
    .first();

  if (existing) {
    return new Response(JSON.stringify({ clientId: existing.id, name: existing.name }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (!name || name.trim().length < 1) {
    return new Response(JSON.stringify({ error: "name required for a new profile" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const result = await env.WATAG_DB.prepare(`INSERT INTO clients (name, phone) VALUES (?, ?)`)
    .bind(name.trim(), cleanPhone)
    .run();

  return new Response(JSON.stringify({ clientId: result.meta.last_row_id, name: name.trim() }), {
    headers: { "content-type": "application/json" },
  });
}
