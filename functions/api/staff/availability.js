// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET  /api/staff/availability?staffId=1&from=2026-06-23&to=2026-06-29
//      Returns availability blocks for a staff member over a date range,
//      used to render the colour coded calendar.
//
// POST /api/staff/availability
//      Body: { staffId, date, startTime, endTime, status }
//      A staff member sets or updates their own availability block.
//      If the slot's status is "available" and someone's on the
//      waitlist for that date (with this artist specifically, or
//      happy with any artist), they get pinged.

import { notifyOwner } from "../../_lib/webpush.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const staffId = url.searchParams.get("staffId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!staffId || !from || !to) {
    return new Response(JSON.stringify({ error: "staffId, from and to are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const rows = await env.WATAG_DB.prepare(
    `SELECT sa.*, s.calendar_color
     FROM staff_availability sa
     JOIN staff s ON s.id = sa.staff_id
     WHERE sa.staff_id = ? AND sa.date BETWEEN ? AND ?
     ORDER BY sa.date, sa.start_time`
  )
    .bind(staffId, from, to)
    .all();

  return new Response(JSON.stringify(rows.results), {
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const { staffId, date, startTime, endTime, status, notes } = await request.json();

  if (!staffId || !date || !startTime || !endTime) {
    return new Response(JSON.stringify({ error: "staffId, date, startTime and endTime are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const result = await env.WATAG_DB.prepare(
    `INSERT INTO staff_availability (staff_id, date, start_time, end_time, status, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(staffId, date, startTime, endTime, status || "available", notes || null)
    .run();

  if ((status || "available") === "available") {
    const matches = await env.WATAG_DB.prepare(
      `SELECT client_id FROM waitlist WHERE requested_date = ? AND (staff_id = ? OR staff_id IS NULL)`
    )
      .bind(date, staffId)
      .all();

    await Promise.all(
      matches.results.map((m) =>
        notifyOwner(env, "client", m.client_id, {
          title: "A slot just opened up",
          body: `There's availability on ${date}, the day you were waiting for.`,
          url: "/calendar",
        })
      )
    );
  }

  return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
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

  await env.WATAG_DB.prepare(`DELETE FROM staff_availability WHERE id = ?`).bind(id).run();

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { "content-type": "application/json" },
  });
}
