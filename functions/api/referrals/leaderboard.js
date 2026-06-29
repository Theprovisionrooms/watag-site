// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET /api/referrals/leaderboard
// Public. Only counts completed referrals, a signup on its own
// doesn't earn a spot, an actual visit does.

export async function onRequestGet({ env }) {
  const rows = await env.WATAG_DB.prepare(
    `SELECT c.name, COUNT(*) AS completed
     FROM referrals r JOIN clients c ON c.id = r.referrer_client_id
     WHERE r.status = 'completed'
     GROUP BY r.referrer_client_id
     ORDER BY completed DESC
     LIMIT 10`
  ).all();

  return new Response(JSON.stringify(rows.results), {
    headers: { "content-type": "application/json" },
  });
}
