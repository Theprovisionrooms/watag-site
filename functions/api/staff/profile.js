// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET  /api/staff/profile?staffId=1                                     public, feeds the client-facing artist directory
// POST /api/staff/profile   Header: Authorization: Bearer <token>       multipart: name, bio, calendarColor, photo (optional file)
//
// An artist's own editable profile, this is what feeds the client
// facing directory. Replaces the old colour-only settings endpoint.

import { resolveStaffSession } from "../../_lib/session.js";

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
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

  const staff = await env.WATAG_DB.prepare(
    `SELECT name, bio, photo_url, calendar_color, role FROM staff WHERE id = ?`
  )
    .bind(staffId)
    .first();

  return new Response(JSON.stringify(staff || {}), {
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const sessionStaffId = await resolveStaffSession(request, env);
  if (!sessionStaffId) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const formData = await request.formData();
  const staffId = sessionStaffId;
  const name = formData.get("name");
  const bio = formData.get("bio") || "";
  const calendarColor = formData.get("calendarColor");
  const photo = formData.get("photo");

  if (!staffId || !name) {
    return new Response(JSON.stringify({ error: "staffId and name are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (calendarColor && !/^#([0-9A-Fa-f]{6})$/.test(calendarColor)) {
    return new Response(JSON.stringify({ error: "calendarColor must be a hex value, e.g. #E91E8C" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let photoUrl = null;
  if (photo && photo.size > 0) {
    const key = `artists/${staffId}/profile-${Date.now()}-${safeFilename(photo.name)}`;
    await env.WATAG_MEDIA.put(key, await photo.arrayBuffer(), { httpMetadata: { contentType: photo.type || "image/jpeg" } });
    photoUrl = key;
  }

  await env.WATAG_DB.prepare(
    `UPDATE staff SET name = ?, bio = ?, calendar_color = COALESCE(?, calendar_color), photo_url = COALESCE(?, photo_url) WHERE id = ?`
  )
    .bind(name.trim(), bio.trim(), calendarColor || null, photoUrl, staffId)
    .run();

  return new Response(JSON.stringify({ updated: true, photoUrl }), {
    headers: { "content-type": "application/json" },
  });
}
