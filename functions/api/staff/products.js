// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET    /api/staff/products                                            list everything, active and inactive, anyone signed in as staff can view
// POST   /api/staff/products    Header: Authorization: Bearer <token>    multipart: name, description, price, image, loyaltyEligible    owner only
// DELETE /api/staff/products    Header: Authorization: Bearer <token>    body: { productId }                                             owner only
//
// Owner-gated since this touches stock and pricing, money things.
// Caller identity comes from a verified staff session token, not a
// staffId the request just claims, and the role check itself is real.

import { isOwner, resolveStaffSession } from "../../_lib/session.js";

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function onRequestGet({ env }) {
  const rows = await env.WATAG_DB.prepare(
    `SELECT p.id, p.name, p.description, p.price_cents, p.image_url, p.active,
            EXISTS(SELECT 1 FROM loyalty_eligible_items l WHERE l.product_id = p.id AND l.active = 1) AS loyalty_eligible
     FROM products p ORDER BY p.created_at DESC`
  ).all();

  return new Response(JSON.stringify(rows.results), {
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const staffId = await resolveStaffSession(request, env);

  if (!(await isOwner(env, staffId))) {
    return new Response(JSON.stringify({ error: "owner_only" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description") || "";
  const price = parseFloat(formData.get("price"));
  const file = formData.get("image");
  const loyaltyEligible = formData.get("loyaltyEligible") === "true";

  if (!name || isNaN(price)) {
    return new Response(JSON.stringify({ error: "name and price are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let imageUrl = null;
  if (file && file.size > 0) {
    const key = `products/${Date.now()}-${safeFilename(file.name)}`;
    await env.WATAG_MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "image/jpeg" } });
    imageUrl = key;
  }

  const priceCents = Math.round(price * 100);

  const result = await env.WATAG_DB.prepare(
    `INSERT INTO products (name, description, price_cents, image_url) VALUES (?, ?, ?, ?)`
  )
    .bind(name, description, priceCents, imageUrl)
    .run();

  const productId = result.meta.last_row_id;

  if (loyaltyEligible) {
    await env.WATAG_DB.prepare(`INSERT INTO loyalty_eligible_items (product_id) VALUES (?)`).bind(productId).run();
  }

  return new Response(JSON.stringify({ id: productId }), {
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestDelete({ request, env }) {
  const staffId = await resolveStaffSession(request, env);

  if (!(await isOwner(env, staffId))) {
    return new Response(JSON.stringify({ error: "owner_only" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const { productId } = await request.json();
  if (!productId) {
    return new Response(JSON.stringify({ error: "productId required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  await env.WATAG_DB.prepare(`UPDATE products SET active = 0 WHERE id = ?`).bind(productId).run();

  return new Response(JSON.stringify({ deactivated: true }), {
    headers: { "content-type": "application/json" },
  });
}
