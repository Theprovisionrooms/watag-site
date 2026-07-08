// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/clients/verify-code
// Body: { email, code, name, phone, referralCode }
// name and phone are only required the first time, for an existing
// profile they're optional and just update the stored details if sent.
// referralCode only matters for a brand new profile, ignored for an
// existing one, can't be referred into an account that already exists.
// Returns a session token, this is what the app stores from now on,
// not a raw client id.

import { createSession } from "../../_lib/session.js";

export async function onRequestPost({ request, env }) {
  const { email, code, name, phone, referralCode } = await request.json();

  if (!email || !code) {
    return new Response(JSON.stringify({ error: "email and code are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  const codeRow = await env.WATAG_DB.prepare(
    `SELECT * FROM client_verification_codes
     WHERE email = ? AND code = ? AND used_at IS NULL AND expires_at > datetime('now')
     ORDER BY created_at DESC LIMIT 1`
  )
    .bind(cleanEmail, code)
    .first();

  if (!codeRow) {
    return new Response(JSON.stringify({ error: "invalid_or_expired_code" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  await env.WATAG_DB.prepare(`UPDATE client_verification_codes SET used_at = datetime('now') WHERE id = ?`)
    .bind(codeRow.id)
    .run();

  let client = await env.WATAG_DB.prepare(`SELECT id, name FROM clients WHERE email = ?`)
    .bind(cleanEmail)
    .first();

  if (!client) {
    if (!name || !phone) {
      return new Response(JSON.stringify({ error: "name and phone required for a new profile" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // same phone already tied to a different email, most likely someone
    // signing up again on a throwaway address to farm another set of
    // rewards. Point them back at the account that already exists rather
    // than silently creating a second one.
    const cleanPhone = phone.trim();
    const phoneMatch = await env.WATAG_DB.prepare(`SELECT email FROM clients WHERE phone = ?`)
      .bind(cleanPhone)
      .first();
    if (phoneMatch) {
      return new Response(
        JSON.stringify({
          error: "phone_already_registered",
          detail: "That phone number is already on an account, sign in with the original email instead.",
        }),
        { status: 409, headers: { "content-type": "application/json" } }
      );
    }

    const result = await env.WATAG_DB.prepare(`INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)`)
      .bind(name.trim(), cleanEmail, phone.trim())
      .run();
    client = { id: result.meta.last_row_id, name: name.trim() };

    if (referralCode) {
      const referrer = await env.WATAG_DB.prepare(`SELECT id FROM clients WHERE referral_code = ?`)
        .bind(referralCode.trim().toUpperCase())
        .first();
      if (referrer && referrer.id !== client.id) {
        await env.WATAG_DB.prepare(
          `INSERT INTO referrals (referrer_client_id, referred_client_id, status) VALUES (?, ?, 'pending')`
        )
          .bind(referrer.id, client.id)
          .run();
      }
    }
  } else if (name || phone) {
    await env.WATAG_DB.prepare(`UPDATE clients SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?`)
      .bind(name ? name.trim() : null, phone ? phone.trim() : null, client.id)
      .run();
    if (name) client.name = name.trim();
  }

  const token = await createSession(env, client.id);

  return new Response(JSON.stringify({ token, name: client.name }), {
    headers: { "content-type": "application/json" },
  });
}
