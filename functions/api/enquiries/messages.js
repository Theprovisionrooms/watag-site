// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET  /api/enquiries/messages?threadId=1            (+ staffId=1 for staff, Authorization header for clients)
// POST /api/enquiries/messages  { threadId, body }   (+ staffId for staff, Authorization header for clients)
//
// Polling based delivery, not a websocket, the data shape (threads,
// messages, read state) is identical to real chat though, so swapping
// in a live connection later is a delivery layer change, not a rewrite.

import { resolveViewer } from "../../_lib/session.js";
import { notifyOwner } from "../../_lib/webpush.js";

async function authoriseThread(env, threadId, viewer) {
  const thread = await env.WATAG_DB.prepare(`SELECT client_id, staff_id FROM enquiry_threads WHERE id = ?`)
    .bind(threadId)
    .first();

  if (!thread) return null;
  const owns = viewer.type === "client" ? thread.client_id === viewer.id : thread.staff_id === viewer.id;
  return owns ? thread : null;
}

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
    `SELECT id, sender_type, body, created_at, read_at FROM enquiry_messages WHERE thread_id = ? ORDER BY created_at ASC`
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
  const { threadId, body: messageBody } = body;
  const viewer = await resolveViewer(request, env, { body });

  if (!viewer) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  if (!threadId || !messageBody || !messageBody.trim()) {
    return new Response(JSON.stringify({ error: "threadId and body required" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const thread = await authoriseThread(env, threadId, viewer);
  if (!thread) {
    return new Response(JSON.stringify({ error: "not_your_thread" }), { status: 403, headers: { "content-type": "application/json" } });
  }

  const result = await env.WATAG_DB.prepare(
    `INSERT INTO enquiry_messages (thread_id, sender_type, sender_id, body) VALUES (?, ?, ?, ?)`
  )
    .bind(threadId, viewer.type, viewer.id, messageBody.trim())
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
    body: messageBody.trim().slice(0, 100),
    url: recipientType === "client" ? `/messages/${threadId}` : `/staff/messages/${threadId}`,
  });

  return new Response(JSON.stringify({ id: result.meta.last_row_id }), { headers: { "content-type": "application/json" } });
}
