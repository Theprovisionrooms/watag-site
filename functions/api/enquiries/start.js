// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/enquiries/start
// Header: Authorization: Bearer <session token>
// Body: { staffId }
// Returns the thread between this client and that staff member,
// creating it the first time, reusing it every time after that.

import { resolveClientSession } from "../../_lib/session.js";

export async function onRequestPost({ request, env }) {
  const clientId = await resolveClientSession(request, env);
  if (!clientId) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { staffId } = await request.json();
  if (!staffId) {
    return new Response(JSON.stringify({ error: "staffId required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  await env.WATAG_DB.prepare(
    `INSERT INTO enquiry_threads (client_id, staff_id) VALUES (?, ?)
     ON CONFLICT(client_id, staff_id) DO NOTHING`
  )
    .bind(clientId, staffId)
    .run();

  const thread = await env.WATAG_DB.prepare(
    `SELECT id FROM enquiry_threads WHERE client_id = ? AND staff_id = ?`
  )
    .bind(clientId, staffId)
    .first();

  return new Response(JSON.stringify({ threadId: thread.id }), {
    headers: { "content-type": "application/json" },
  });
}
