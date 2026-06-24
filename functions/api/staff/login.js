// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/staff/login
// Body: { staffId, pin }
// v1 PIN login for the 3 staff accounts. PINs are hashed with SHA-256
// before comparison. Fine for a single studio with 3 known staff,
// worth moving to proper session tokens if staff count grows.

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }) {
  const { staffId, pin } = await request.json();

  if (!staffId || !pin) {
    return new Response(JSON.stringify({ error: "staffId and pin required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const staff = await env.WATAG_DB.prepare(
    `SELECT id, name, calendar_color, pin_hash FROM staff WHERE id = ? AND active = 1`
  )
    .bind(staffId)
    .first();

  if (!staff) {
    return new Response(JSON.stringify({ error: "staff_not_found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const pinHash = await sha256Hex(pin);

  if (pinHash !== staff.pin_hash) {
    return new Response(JSON.stringify({ error: "incorrect_pin" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ staffId: staff.id, name: staff.name, calendarColor: staff.calendar_color }),
    { headers: { "content-type": "application/json" } }
  );
}
