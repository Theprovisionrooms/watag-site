// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET /api/shop/products
// Active products only, for the public shop page.

export async function onRequestGet({ env }) {
  const rows = await env.WATAG_DB.prepare(
    `SELECT id, name, description, price_cents, image_url FROM products WHERE active = 1 ORDER BY created_at DESC`
  ).all();

  return new Response(JSON.stringify(rows.results), {
    headers: { "content-type": "application/json" },
  });
}
