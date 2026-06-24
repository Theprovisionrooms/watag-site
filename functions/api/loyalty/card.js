// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET /api/loyalty/card?clientId=1
// Returns the client's current stamp count and any pending reward,
// used to render the loyalty passport screen.

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");

  if (!clientId) {
    return new Response(JSON.stringify({ error: "clientId required" }), {
      status: 400,
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
      tiers: { 3: "small_tattoo", 6: "merch", 9: "session_credit" },
    }),
    { headers: { "content-type": "application/json" } }
  );
}
