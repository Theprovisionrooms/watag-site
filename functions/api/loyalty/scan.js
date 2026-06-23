// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/loyalty/scan
// Staff scan a customer's QR through the in-app camera view, the decoded
// token gets posted here. Validates the token, applies the stamp, and
// flags a reward if the client has hit 3, 6 or 9 stamps.
//
// Reward tiers (locked with Jay):
//   3 stamps -> small tattoo
//   6 stamps -> item of merch, client chooses from the loyalty-eligible list
//   9 stamps -> 3 hour session credit, card resets to 0 once redeemed

const STAMP_COOLDOWN_SECONDS = 120;

const TIER_REWARDS = {
  3: "small_tattoo",
  6: "merch",
  9: "session_credit",
};

export async function onRequestPost({ request, env }) {
  const { token, staffId } = await request.json();

  if (!token || !staffId) {
    return new Response(JSON.stringify({ error: "token and staffId required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const db = env.WATAG_DB;

  const qrRow = await db
    .prepare(`SELECT * FROM qr_tokens WHERE token = ?`)
    .bind(token)
    .first();

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

  // mark token used immediately, single use
  await db.prepare(`UPDATE qr_tokens SET used_at = datetime('now') WHERE id = ?`).bind(qrRow.id).run();

  let card = await db
    .prepare(`SELECT * FROM loyalty_cards WHERE client_id = ?`)
    .bind(clientId)
    .first();

  if (!card) {
    await db.prepare(`INSERT INTO loyalty_cards (client_id, stamp_count) VALUES (?, 0)`).bind(clientId).run();
    card = await db.prepare(`SELECT * FROM loyalty_cards WHERE client_id = ?`).bind(clientId).first();
  }

  // cooldown check, stops an accidental double tap registering two stamps
  if (card.last_stamped_at) {
    const secondsSinceLast = (Date.now() - new Date(card.last_stamped_at).getTime()) / 1000;
    if (secondsSinceLast < STAMP_COOLDOWN_SECONDS) {
      return new Response(
        JSON.stringify({ error: "cooldown_active", retryAfterSeconds: Math.ceil(STAMP_COOLDOWN_SECONDS - secondsSinceLast) }),
        { status: 429, headers: { "content-type": "application/json" } }
      );
    }
  }

  const newCount = card.stamp_count + 1;
  const reward = TIER_REWARDS[newCount] || null;

  await db
    .prepare(`UPDATE loyalty_cards SET stamp_count = ?, pending_reward = ?, last_stamped_at = datetime('now') WHERE client_id = ?`)
    .bind(newCount, reward, clientId)
    .run();

  await db
    .prepare(`INSERT INTO loyalty_stamp_log (client_id, staff_id) VALUES (?, ?)`)
    .bind(clientId, staffId)
    .run();

  return new Response(
    JSON.stringify({
      clientId,
      stampCount: newCount,
      pendingReward: reward,
    }),
    { headers: { "content-type": "application/json" } }
  );
}
