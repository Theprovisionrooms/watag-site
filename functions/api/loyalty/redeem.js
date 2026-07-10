// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/loyalty/redeem
// Header: Authorization: Bearer <staff session token>
// Body: { token }
//
// Same rotating QR token clients use for stamping, staff scan it in
// "redeem" mode instead of "stamp" mode when handing over a reward
// the client already earned, this does NOT add a stamp.
//
// Clears the pending reward and logs it in loyalty_redemptions. If
// this was the top tier (9 stamps), the card resets to 0 so the next
// cycle can start, lower tiers just clear the flag and stamp_count
// carries on as normal.

import { resolveStaffSession } from "../../_lib/session.js";
import { tierForReward, TOP_TIER } from "../../_lib/loyalty.js";

export async function onRequestPost({ request, env }) {
  const staffId = await resolveStaffSession(request, env);
  if (!staffId) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { token } = await request.json();
  if (!token) {
    return new Response(JSON.stringify({ error: "token required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const db = env.WATAG_DB;

  const qrRow = await db.prepare(`SELECT * FROM qr_tokens WHERE token = ?`).bind(token).first();
  if (!qrRow) {
    return new Response(JSON.stringify({ error: "invalid_token" }), { status: 400, headers: { "content-type": "application/json" } });
  }
  if (qrRow.used_at) {
    return new Response(JSON.stringify({ error: "token_already_used" }), { status: 409, headers: { "content-type": "application/json" } });
  }
  if (new Date(qrRow.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: "token_expired" }), { status: 410, headers: { "content-type": "application/json" } });
  }

  const clientId = qrRow.client_id;

  await db.prepare(`UPDATE qr_tokens SET used_at = datetime('now') WHERE id = ?`).bind(qrRow.id).run();

  const card = await db.prepare(`SELECT * FROM loyalty_cards WHERE client_id = ?`).bind(clientId).first();

  if (!card || !card.pending_reward) {
    return new Response(JSON.stringify({ error: "no_pending_reward" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const reward = card.pending_reward;
  const tier = tierForReward(reward);
  const isTopTier = tier === TOP_TIER;

  await db
    .prepare(
      `UPDATE loyalty_cards SET pending_reward = NULL, stamp_count = ? WHERE client_id = ?`
    )
    .bind(isTopTier ? 0 : card.stamp_count, clientId)
    .run();

  await db
    .prepare(
      `INSERT INTO loyalty_redemptions (client_id, staff_id, tier, reward_description) VALUES (?, ?, ?, ?)`
    )
    .bind(clientId, staffId, tier, reward)
    .run();

  return new Response(
    JSON.stringify({
      clientId,
      redeemed: reward,
      stampCount: isTopTier ? 0 : card.stamp_count,
    }),
    { headers: { "content-type": "application/json" } }
  );
}
