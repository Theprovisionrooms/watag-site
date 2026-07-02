// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/push/subscribe
// Body: { staffId, subscription }  (staff side)
// Header: Authorization: Bearer <session token>, body: { subscription }  (client side)
//
// `subscription` is the raw object the browser's PushManager.subscribe()
// returns (endpoint + keys.p256dh + keys.auth).

import { resolveClientSession } from "../../_lib/session.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const { staffId, subscription } = body;

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return new Response(JSON.stringify({ error: "valid subscription required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let ownerType, ownerId;
  const clientId = await resolveClientSession(request, env);
  if (clientId) {
    ownerType = "client";
    ownerId = clientId;
  } else if (staffId) {
    ownerType = "staff";
    ownerId = Number(staffId);
  } else {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  await env.WATAG_DB.prepare(
    `INSERT INTO push_subscriptions (owner_type, owner_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET owner_type = excluded.owner_type, owner_id = excluded.owner_id`
  )
    .bind(ownerType, ownerId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth)
    .run();

  return new Response(JSON.stringify({ subscribed: true }), {
    headers: { "content-type": "application/json" },
  });
}
