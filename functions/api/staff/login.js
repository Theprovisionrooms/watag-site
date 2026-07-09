// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/staff/login
// Body: { staffId, pin }
// PIN login for the small staff roster. PINs are hashed with SHA-256
// before comparison. 6 wrong PINs in a row locks that account out for
// 15 minutes, resets on the next correct login. A correct login now
// returns a real session token, every other staff endpoint requires it
// in the Authorization header, nothing trusts a bare staffId anymore.

import { sha256Hex, createStaffSession } from "../../_lib/session.js";

const MAX_ATTEMPTS = 6;
const LOCKOUT_MINUTES = 15;

export async function onRequestPost({ request, env }) {
  const { staffId, pin } = await request.json();

  if (!staffId || !pin) {
    return new Response(JSON.stringify({ error: "staffId and pin required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const staff = await env.WATAG_DB.prepare(
    `SELECT id, name, calendar_color, role, pin_hash, failed_pin_attempts, locked_until FROM staff WHERE id = ? AND active = 1`
  )
    .bind(staffId)
    .first();

  if (!staff) {
    return new Response(JSON.stringify({ error: "staff_not_found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  if (staff.locked_until && new Date(staff.locked_until) > new Date()) {
    const retryAfterSeconds = Math.ceil((new Date(staff.locked_until) - new Date()) / 1000);
    return new Response(JSON.stringify({ error: "locked", retryAfterSeconds }), {
      status: 423,
      headers: { "content-type": "application/json" },
    });
  }

  const pinHash = await sha256Hex(pin);

  if (pinHash !== staff.pin_hash) {
    const attempts = (staff.failed_pin_attempts || 0) + 1;
    const lockedUntil =
      attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString() : null;

    await env.WATAG_DB.prepare(`UPDATE staff SET failed_pin_attempts = ?, locked_until = ? WHERE id = ?`)
      .bind(attempts, lockedUntil, staff.id)
      .run();

    if (lockedUntil) {
      return new Response(JSON.stringify({ error: "locked", retryAfterSeconds: LOCKOUT_MINUTES * 60 }), {
        status: 423,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "incorrect_pin", attemptsRemaining: MAX_ATTEMPTS - attempts }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  await env.WATAG_DB.prepare(`UPDATE staff SET failed_pin_attempts = 0, locked_until = NULL WHERE id = ?`)
    .bind(staff.id)
    .run();

  const token = await createStaffSession(env, staff.id);

  return new Response(
    JSON.stringify({
      token,
      staffId: staff.id,
      name: staff.name,
      calendarColor: staff.calendar_color,
      role: staff.role,
    }),
    { headers: { "content-type": "application/json" } }
  );
}
