// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET /api/staff/list
// Active staff with their chosen calendar colour, used to render the
// rota legend and to drive the staff login picker instead of a
// hardcoded list.

export async function onRequestGet({ env }) {
  const rows = await env.WATAG_DB.prepare(
    `SELECT id, name, calendar_color FROM staff WHERE active = 1 ORDER BY name`
  ).all();

  return new Response(JSON.stringify(rows.results), {
    headers: { "content-type": "application/json" },
  });
}
