// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST   /api/waitlist   Header: Authorization: Bearer <session token>   body: { staffId (optional), requestedDate, notes }
// GET    /api/waitlist   ?staffId=1              artist view: entries for them specifically, plus anyone happy with any artist
// GET    /api/waitlist   Authorization header     client view: that client's own requests and their current status
// PATCH  /api/waitlist   body: { id, action: "approve" | "decline" }  (+ staffId for staff)
// DELETE /api/waitlist   body: { id }   clears an entry entirely, once it's been actioned and booked in
//
// A request tied to a specific artist can only be approved or declined
// by that artist. A request left open to "any artist" can be actioned
// by whichever artist gets there first, and that locks staff_id to
// them so it's clear afterwards who actually picked it up.

import { resolveClientSession } from "../../_lib/session.js";
import { notifyOwner } from "../../_lib/webpush.js";

export async function onRequestPost({ request, env }) {
  const clientId = await resolveClientSession(request, env);
  if (!clientId) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { staffId, requestedDate, notes } = await request.json();
  if (!requestedDate) {
    return new Response(JSON.stringify({ error: "requestedDate required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const result = await env.WATAG_DB.prepare(
    `INSERT INTO waitlist (client_id, staff_id, requested_date, notes) VALUES (?, ?, ?, ?)`
  )
    .bind(clientId, staffId || null, requestedDate, notes || null)
    .run();

  return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const staffId = url.searchParams.get("staffId");

  if (staffId) {
    const rows = await env.WATAG_DB.prepare(
      `SELECT w.id, w.requested_date, w.notes, w.status, w.staff_id, w.created_at, c.name AS client_name, c.phone AS client_phone
       FROM waitlist w JOIN clients c ON c.id = w.client_id
       WHERE w.staff_id = ? OR w.staff_id IS NULL
       ORDER BY w.requested_date ASC`
    )
      .bind(staffId)
      .all();

    return new Response(JSON.stringify(rows.results), { headers: { "content-type": "application/json" } });
  }

  const clientId = await resolveClientSession(request, env);
  if (!clientId) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const rows = await env.WATAG_DB.prepare(
    `SELECT w.id, w.requested_date, w.notes, w.status, w.created_at, s.name AS artist_name
     FROM waitlist w LEFT JOIN staff s ON s.id = w.staff_id
     WHERE w.client_id = ? ORDER BY w.created_at DESC`
  )
    .bind(clientId)
    .all();

  return new Response(JSON.stringify(rows.results), { headers: { "content-type": "application/json" } });
}

export async function onRequestPatch({ request, env }) {
  const { id, action, staffId } = await request.json();

  if (!id || !["approve", "decline"].includes(action) || !staffId) {
    return new Response(JSON.stringify({ error: "id, a valid action, and staffId are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const entry = await env.WATAG_DB.prepare(`SELECT * FROM waitlist WHERE id = ?`).bind(id).first();
  if (!entry) {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { "content-type": "application/json" } });
  }

  if (entry.staff_id && entry.staff_id !== Number(staffId)) {
    return new Response(JSON.stringify({ error: "requested_a_different_artist" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const newStatus = action === "approve" ? "approved" : "declined";

  await env.WATAG_DB.prepare(`UPDATE waitlist SET status = ?, staff_id = ? WHERE id = ?`)
    .bind(newStatus, entry.staff_id || Number(staffId), id)
    .run();

  await notifyOwner(env, "client", entry.client_id, {
    title: newStatus === "approved" ? "Your waitlist request was approved" : "Update on your waitlist request",
    body:
      newStatus === "approved"
        ? `Good news, there's a slot for you on ${entry.requested_date}, get in touch to confirm.`
        : `Sorry, ${entry.requested_date} isn't going to work out this time.`,
    url: "/waitlist",
  });

  return new Response(JSON.stringify({ status: newStatus }), { headers: { "content-type": "application/json" } });
}

export async function onRequestDelete({ request, env }) {
  const { id } = await request.json();
  if (!id) {
    return new Response(JSON.stringify({ error: "id required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  await env.WATAG_DB.prepare(`DELETE FROM waitlist WHERE id = ?`).bind(id).run();

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { "content-type": "application/json" },
  });
}
