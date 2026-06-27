// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST   /api/waitlist   Header: Authorization: Bearer <session token>   body: { staffId (optional), requestedDate, notes }
// GET    /api/waitlist   ?staffId=1   entries for that artist, plus anyone happy with any artist
// DELETE /api/waitlist   body: { id }   staff clears an entry once it's been actioned

import { resolveClientSession } from "../_lib/session.js";

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

  if (!staffId) {
    return new Response(JSON.stringify({ error: "staffId required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const rows = await env.WATAG_DB.prepare(
    `SELECT w.id, w.requested_date, w.notes, w.created_at, c.name AS client_name, c.phone AS client_phone
     FROM waitlist w JOIN clients c ON c.id = w.client_id
     WHERE w.staff_id = ? OR w.staff_id IS NULL
     ORDER BY w.requested_date ASC`
  )
    .bind(staffId)
    .all();

  return new Response(JSON.stringify(rows.results), {
    headers: { "content-type": "application/json" },
  });
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
