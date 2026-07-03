// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/loyalty/scan
// Staff scan a customer's QR through the in-app camera view, the decoded
// token gets posted here. Validates the token, applies the stamp, and
// flags a reward if the client has hit 3, 6 or 9 stamps.
//
// Reward tiers (locked with Jay, merch and session credit swapped since):
//   3 stamps -> small tattoo
//   6 stamps -> 3 hour session credit
//   9 stamps -> item of merch, client chooses from the loyalty-eligible list, card resets to 0 once redeemed
//
// If this is someone's first ever stamp and they signed up through a
// referral link, that referral completes here and the person who
// referred them gets a bonus stamp on their own card. A signup alone
// never earns that, only a real first visit does.
//
// Push notifications fire here too, for the client whose card was
// just stamped and, if a referral completed, for the referrer.

import { notifyOwner } from "../../_lib/webpush.js";

const STAMP_COOLDOWN_SECONDS = 120;

const TIER_REWARDS = {
  3: "small_tattoo",
  6: "session_credit",
  9: "merch",
};

async function applyStamp(db, clientId, staffId) {
  let card = await db.prepare(`SELECT * FROM loyalty_cards WHERE client_id = ?`).bind(clientId).first();

  if (!card) {
    await db.prepare(`INSERT INTO loyalty_cards (client_id, stamp_count) VALUES (?, 0)`).bind(clientId).run();
    card = await db.prepare(`SELECT * FROM loyalty_cards WHERE client_id = ?`).bind(clientId).first();
  }

  const newCount = card.stamp_count + 1;
  const reward = TIER_REWARDS[newCount] || null;

  await db
    .prepare(`UPDATE loyalty_cards SET stamp_count = ?, pending_reward = ?, last_stamped_at = datetime('now') WHERE client_id = ?`)
    .bind(newCount, reward, clientId)
    .run();

  await db.prepare(`INSERT INTO loyalty_stamp_log (client_id, staff_id) VALUES (?, ?)`).bind(clientId, staffId).run();

  return { newCount, reward };
}

export async function onRequestPost({ request, env }) {
  const { token, staffId } = await request.json();

  if (!token || !staffId) {
    return new Response(JSON.stringify({ error: "token and staffId required" }), {
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

  // mark token used immediately, single use
  await db.prepare(`UPDATE qr_tokens SET used_at = datetime('now') WHERE id = ?`).bind(qrRow.id).run();

  let card = await db.prepare(`SELECT * FROM loyalty_cards WHERE client_id = ?`).bind(clientId).first();

  // cooldown check, stops an accidental double tap registering two stamps
  if (card?.last_stamped_at) {
    const secondsSinceLast = (Date.now() - new Date(card.last_stamped_at).getTime()) / 1000;
    if (secondsSinceLast < STAMP_COOLDOWN_SECONDS) {
      return new Response(
        JSON.stringify({ error: "cooldown_active", retryAfterSeconds: Math.ceil(STAMP_COOLDOWN_SECONDS - secondsSinceLast) }),
        { status: 429, headers: { "content-type": "application/json" } }
      );
    }
  }

  // check before applying the stamp, this is what tells us if it's their first ever visit
  const priorStamps = await db.prepare(`SELECT COUNT(*) AS c FROM loyalty_stamp_log WHERE client_id = ?`).bind(clientId).first();
  const isFirstEverStamp = priorStamps.c === 0;

  const { newCount, reward } = await applyStamp(db, clientId, staffId);

  const stampMessage = reward
    ? { title: "Reward unlocked!", body: `Stamp ${newCount}/9, your ${reward.replace("_", " ")} is ready to redeem.` }
    : { title: "Stamp added", body: `You're on ${newCount}/9 stamps.` };
  await notifyOwner(env, "client", clientId, { ...stampMessage, url: "/card" });

  let referralCompleted = false;

  if (isFirstEverStamp) {
    const pendingReferral = await db
      .prepare(`SELECT * FROM referrals WHERE referred_client_id = ? AND status = 'pending'`)
      .bind(clientId)
      .first();

    if (pendingReferral) {
      await db
        .prepare(`UPDATE referrals SET status = 'completed', completed_at = datetime('now') WHERE id = ?`)
        .bind(pendingReferral.id)
        .run();

      await applyStamp(db, pendingReferral.referrer_client_id, staffId);
      await notifyOwner(env, "client", pendingReferral.referrer_client_id, {
        title: "Referral bonus!",
        body: "Someone you referred just came in, you've earned a bonus stamp.",
        url: "/card",
      });
      referralCompleted = true;
    }
  }

  return new Response(
    JSON.stringify({
      clientId,
      stampCount: newCount,
      pendingReward: reward,
      referralCompleted,
    }),
    { headers: { "content-type": "application/json" } }
  );
}
