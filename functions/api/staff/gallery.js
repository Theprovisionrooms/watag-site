// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET    /api/staff/gallery?staffId=1        list a staff member's gallery
// POST   /api/staff/gallery                  upload a new image, multipart form: staffId, file, caption (optional)
// DELETE /api/staff/gallery                  body: { imageId }, removes the row and the R2 object

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
  const formData = await request.formData();
  const staffId = formData.get("staffId");
  const caption = formData.get("caption") || null;
  const file = formData.get("file");

  if (!staffId || !file) {
    return new Response(JSON.stringify({ error: "staffId and file required" }), {
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
  const { imageId } = await request.json();

  if (!imageId) {
    return new Response(JSON.stringify({ error: "imageId required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const row = await env.WATAG_DB.prepare(`SELECT image_url FROM staff_gallery WHERE id = ?`)
    .bind(imageId)
    .first();

  if (row) {
    await env.WATAG_MEDIA.delete(row.image_url);
  }

  await env.WATAG_DB.prepare(`DELETE FROM staff_gallery WHERE id = ?`).bind(imageId).run();

  return new Response(JSON.stringify({ deleted: true }), {
    headers: { "content-type": "application/json" },
  });
}
