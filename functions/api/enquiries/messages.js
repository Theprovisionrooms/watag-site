// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET    /api/enquiries/messages?threadId=1          Authorization header, client or staff session
// POST   /api/enquiries/messages  { threadId, body, photoUrl }   text, a photo, or both, at least one required
// DELETE /api/enquiries/messages  { messageId }       Authorization header, client or staff session
//
// Delete is allowed for whoever sent the message, or for the artist in
// the thread regardless of who sent it (moderation, and the main way
// to actually free up R2 storage once a photo's no longer needed,
// keeps ongoing storage cost low without needing an expiry job).
//
// Polling based delivery, not a websocket, the data shape (threads,
// messages, read state) is identical to real chat though, so swapping
// in a live connection later is a delivery layer change, not a rewrite.

import { resolveViewer } from "../../_lib/session.js";
import { notifyOwner } from "../../_lib/webpush.js";
import { authoriseThread } from "../../_lib/enquiries.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const threadId = url.searchParams.get("threadId");
  const viewer = await resolveViewer(request, env, { url });

  if (!viewer) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  if (!threadId) {
    return new Response(JSON.stringify({ error: "threadId required" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const thread = await authoriseThread(env, threadId, viewer);
  if (!thread) {
    return new Response(JSON.stringify({ error: "not_your_thread" }), { status: 403, headers: { "content-type": "application/json" } });
  }

  const messages = await env.WATAG_DB.prepare(
    `SELECT id, sender_type, sender_id, body, photo_url, created_at, read_at FROM enquiry_messages WHERE thread_id = ? ORDER BY created_at ASC`
  )
    .bind(threadId)
    .all();

  // mark anything not sent by this viewer as read, now that they've opened it
  const otherSenderType = viewer.type === "client" ? "staff" : "client";
  await env.WATAG_DB.prepare(
    `UPDATE enquiry_messages SET read_at = datetime('now') WHERE thread_id = ? AND sender_type = ? AND read_at IS NULL`
  )
    .bind(threadId, otherSenderType)
    .run();

  return new Response(JSON.stringify(messages.results), { headers: { "content-type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const { threadId, body: messageBody, photoUrl } = body;
  const viewer = await resolveViewer(request, env, { body });

  if (!viewer) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  const trimmedBody = (messageBody || "").trim();
  if (!threadId || (!trimmedBody && !photoUrl)) {
    return new Response(JSON.stringify({ error: "threadId and a body or a photo are required" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const thread = await authoriseThread(env, threadId, viewer);
  if (!thread) {
    return new Response(JSON.stringify({ error: "not_your_thread" }), { status: 403, headers: { "content-type": "application/json" } });
  }

  const result = await env.WATAG_DB.prepare(
    `INSERT INTO enquiry_messages (thread_id, sender_type, sender_id, body, photo_url) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(threadId, viewer.type, viewer.id, trimmedBody, photoUrl || null)
    .run();

  await env.WATAG_DB.prepare(`UPDATE enquiry_threads SET last_message_at = datetime('now') WHERE id = ?`)
    .bind(threadId)
    .run();

  const recipientType = viewer.type === "client" ? "staff" : "client";
  const recipientId = viewer.type === "client" ? thread.staff_id : thread.client_id;
  const senderTable = viewer.type === "client" ? "clients" : "staff";
  const sender = await env.WATAG_DB.prepare(`SELECT name FROM ${senderTable} WHERE id = ?`).bind(viewer.id).first();

  await notifyOwner(env, recipientType, recipientId, {
    title: sender?.name || "New message",
    body: photoUrl ? "sent a photo" : trimmedBody.slice(0, 100),
    url: recipientType === "client" ? `/messages/${threadId}` : `/staff/messages/${threadId}`,
  });

  return new Response(JSON.stringify({ id: result.meta.last_row_id }), { headers: { "content-type": "application/json" } });
}

export async function onRequestDelete({ request, env }) {
  const body = await request.json();
  const { messageId } = body;
  const viewer = await resolveViewer(request, env, { body });

  if (!viewer) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  if (!messageId) {
    return new Response(JSON.stringify({ error: "messageId required" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const message = await env.WATAG_DB.prepare(
    `SELECT thread_id, sender_type, sender_id, photo_url FROM enquiry_messages WHERE id = ?`
  )
    .bind(messageId)
    .first();

  if (!message) {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { "content-type": "application/json" } });
  }

  const thread = await authoriseThread(env, message.thread_id, viewer);
  if (!thread) {
    return new Response(JSON.stringify({ error: "not_your_thread" }), { status: 403, headers: { "content-type": "application/json" } });
  }

  const isSender = message.sender_type === viewer.type && message.sender_id === viewer.id;
  const isArtistModerating = viewer.type === "staff";
  if (!isSender && !isArtistModerating) {
    return new Response(JSON.stringify({ error: "not_your_message" }), { status: 403, headers: { "content-type": "application/json" } });
  }

  if (message.photo_url) {
    await env.WATAG_MEDIA.delete(message.photo_url);
  }
  await env.WATAG_DB.prepare(`DELETE FROM enquiry_messages WHERE id = ?`).bind(messageId).run();

  return new Response(JSON.stringify({ deleted: true }), { headers: { "content-type": "application/json" } });
}
