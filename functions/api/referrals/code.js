// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET /api/referrals/code
// Header: Authorization: Bearer <session token>
// Returns the signed-in client's referral code, generating one the
// first time they ask, plus how many people they've referred and how
// many of those have actually come in for their first stamp.

import { resolveClientSession } from "../../_lib/session.js";

function randomCode() {
  // short, uppercase, easy to read out loud or type from a screenshot
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // skips easily confused characters (0/O, 1/I)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function onRequestGet({ request, env }) {
  const clientId = await resolveClientSession(request, env);
  if (!clientId) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let client = await env.WATAG_DB.prepare(`SELECT referral_code FROM clients WHERE id = ?`).bind(clientId).first();

  if (!client.referral_code) {
    let code;
    let attempts = 0;
    while (attempts < 5) {
      code = randomCode();
      const existing = await env.WATAG_DB.prepare(`SELECT id FROM clients WHERE referral_code = ?`).bind(code).first();
      if (!existing) break;
      attempts++;
    }
    await env.WATAG_DB.prepare(`UPDATE clients SET referral_code = ? WHERE id = ?`).bind(code, clientId).run();
    client = { referral_code: code };
  }

  const referred = await env.WATAG_DB.prepare(
    `SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
     FROM referrals WHERE referrer_client_id = ?`
  )
    .bind(clientId)
    .first();

  return new Response(
    JSON.stringify({
      code: client.referral_code,
      referredCount: referred.total || 0,
      completedCount: referred.completed || 0,
    }),
    { headers: { "content-type": "application/json" } }
  );
}
