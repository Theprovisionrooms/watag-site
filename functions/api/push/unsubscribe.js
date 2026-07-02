// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/push/unsubscribe
// Body: { endpoint }

export async function onRequestPost({ request, env }) {
  const { endpoint } = await request.json();
  if (!endpoint) {
    return new Response(JSON.stringify({ error: "endpoint required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  await env.WATAG_DB.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).bind(endpoint).run();

  return new Response(JSON.stringify({ unsubscribed: true }), {
    headers: { "content-type": "application/json" },
  });
}
