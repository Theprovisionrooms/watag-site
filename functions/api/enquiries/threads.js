// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET /api/enquiries/threads
// Header: Authorization: Bearer <session token>, either a client or staff one
// Returns each thread with the other party's name, a preview of the
// last message, and an unread count for messages not sent by the viewer.

import { resolveViewer } from "../../_lib/session.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const viewer = await resolveViewer(request, env, { url });

  if (!viewer) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const otherSenderType = viewer.type === "client" ? "staff" : "client";

  const query =
    viewer.type === "client"
      ? `SELECT t.id, s.name AS other_name, s.calendar_color AS other_color, NULL AS other_phone, t.last_message_at
         FROM enquiry_threads t JOIN staff s ON s.id = t.staff_id
         WHERE t.client_id = ? ORDER BY t.last_message_at DESC`
      : `SELECT t.id, c.name AS other_name, NULL AS other_color, c.phone AS other_phone, t.last_message_at
         FROM enquiry_threads t JOIN clients c ON c.id = t.client_id
         WHERE t.staff_id = ? ORDER BY t.last_message_at DESC`;

  const threads = await env.WATAG_DB.prepare(query).bind(viewer.id).all();

  const withPreviewAndUnread = await Promise.all(
    threads.results.map(async (t) => {
      const last = await env.WATAG_DB.prepare(
        `SELECT body FROM enquiry_messages WHERE thread_id = ? ORDER BY created_at DESC LIMIT 1`
      )
        .bind(t.id)
        .first();

      const unread = await env.WATAG_DB.prepare(
        `SELECT COUNT(*) AS n FROM enquiry_messages WHERE thread_id = ? AND sender_type = ? AND read_at IS NULL`
      )
        .bind(t.id, otherSenderType)
        .first();

      return { ...t, lastMessage: last?.body || null, unreadCount: unread.n };
    })
  );

  return new Response(JSON.stringify(withPreviewAndUnread), {
    headers: { "content-type": "application/json" },
  });
}
