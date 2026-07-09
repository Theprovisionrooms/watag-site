// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/staff/change-pin   Header: Authorization: Bearer <staff session token>
// Body: { currentPin, newPin }
// Requires the current PIN to change it, same as changing a password
// anywhere else. Blocks the obvious weak choices, doesn't try to be a
// full password policy beyond that, this is a PIN for 3 known people
// in one building, not a bank login.

import { sha256Hex, resolveStaffSession } from "../../_lib/session.js";

const WEAK_PINS = new Set([
  "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999",
  "1234", "4321", "1212", "2121", "0123", "6789",
]);

export async function onRequestPost({ request, env }) {
  const sessionStaffId = await resolveStaffSession(request, env);
  if (!sessionStaffId) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { currentPin, newPin } = await request.json();
  const staffId = sessionStaffId;

  if (!currentPin || !newPin) {
    return new Response(JSON.stringify({ error: "currentPin and newPin are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (newPin.length < 4) {
    return new Response(JSON.stringify({ error: "pin must be at least 4 digits" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (WEAK_PINS.has(newPin)) {
    return new Response(JSON.stringify({ error: "that pin's too easy to guess, pick something less obvious" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const staff = await env.WATAG_DB.prepare(`SELECT pin_hash FROM staff WHERE id = ?`).bind(staffId).first();

  if (!staff || (await sha256Hex(currentPin)) !== staff.pin_hash) {
    return new Response(JSON.stringify({ error: "current pin is incorrect" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const newHash = await sha256Hex(newPin);
  await env.WATAG_DB.prepare(`UPDATE staff SET pin_hash = ? WHERE id = ?`).bind(newHash, staffId).run();

  // a changed PIN should kill every other session on this account, e.g.
  // if the PIN just leaked and this is the account holder locking it down
  await env.WATAG_DB.prepare(`DELETE FROM staff_sessions WHERE staff_id = ?`).bind(staffId).run();

  return new Response(JSON.stringify({ updated: true }), {
    headers: { "content-type": "application/json" },
  });
}
