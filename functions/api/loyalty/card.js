// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET /api/loyalty/card
// Header: Authorization: Bearer <session token>
// Returns the signed-in client's stamp count and pending reward.
// No longer takes a clientId from the caller, that was spoofable.

import { resolveClientSession } from "../../_lib/session.js";

export async function onRequestGet({ request, env }) {
  const clientId = await resolveClientSession(request, env);

  if (!clientId) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let card = await env.WATAG_DB.prepare(
    `SELECT stamp_count, pending_reward, last_stamped_at FROM loyalty_cards WHERE client_id = ?`
  )
    .bind(clientId)
    .first();

  if (!card) {
    card = { stamp_count: 0, pending_reward: null, last_stamped_at: null };
  }

  return new Response(
    JSON.stringify({
      stampCount: card.stamp_count,
      pendingReward: card.pending_reward,
      lastStampedAt: card.last_stamped_at,
      tiers: { 3: "small_tattoo", 6: "session_credit", 9: "merch" },
    }),
    { headers: { "content-type": "application/json" } }
  );
}
