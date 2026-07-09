// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET    /api/staff/gallery?staffId=1        public, list a staff member's gallery
// POST   /api/staff/gallery   Header: Authorization: Bearer <token>   multipart form: file, caption (optional)
// DELETE /api/staff/gallery   Header: Authorization: Bearer <token>   body: { imageId }, own images or owner role only

import { resolveStaffSession, isOwner } from "../../_lib/session.js";

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

  const rows = await env.WATAG_DB.prepare(
    `SELECT id, image_url, caption, sort_order, created_at
     FROM staff_gallery WHERE staff_id = ? ORDER BY sort_order, created_at DESC`
  )
    .bind(staffId)
    .all();

  return new Response(JSON.stringify(rows.results), {
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
  const caption = formData.get("caption") || null;
  const file = formData.get("file");

  if (!file) {
    return new Response(JSON.stringify({ error: "file required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const key = `gallery/${staffId}/${Date.now()}-${safeFilename(file.name)}`;

  await env.WATAG_MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "image/jpeg" },
  });

  const result = await env.WATAG_DB.prepare(
    `INSERT INTO staff_gallery (staff_id, image_url, caption) VALUES (?, ?, ?)`
  )
    .bind(staffId, key, caption)
    .run();

  return new Response(JSON.stringify({ id: result.meta.last_row_id, imageUrl: key }), {
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestDelete({ request, env }) {
  const sessionStaffId = await resolveStaffSession(request, env);
  if (!sessionStaffId) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { imageId } = await request.json();

  if (!imageId) {
    return new Response(JSON.stringify({ error: "imageId required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const row = await env.WATAG_DB.prepare(`SELECT staff_id, image_url FROM staff_gallery WHERE id = ?`)
    .bind(imageId)
    .first();

  if (!row) {
    return new Response(JSON.stringify({ deleted: true }), { headers: { "content-type": "application/json" } });
  }

  if (row.staff_id !== sessionStaffId && !(await isOwner(env, sessionStaffId))) {
    return new Response(JSON.stringify({ error: "not_your_image" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  await env.WATAG_MEDIA.delete(row.image_url);
  await env.WATAG_DB.prepare(`DELETE FROM staff_gallery WHERE id = ?`).bind(imageId).run();

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { "content-type": "application/json" },
  });
}
