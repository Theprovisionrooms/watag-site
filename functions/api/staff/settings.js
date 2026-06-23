// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// PATCH /api/staff/settings
// Body: { staffId, calendarColor }
// Staff pick their own RGB colour for the calendar on login/settings.

export async function onRequestPatch({ request, env }) {
  const { staffId, calendarColor } = await request.json();

  if (!staffId || !calendarColor) {
    return new Response(JSON.stringify({ error: "staffId and calendarColor are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const isValidHex = /^#([0-9A-Fa-f]{6})$/.test(calendarColor);
  if (!isValidHex) {
    return new Response(JSON.stringify({ error: "calendarColor must be a hex value, e.g. #E91E8C" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  await env.WATAG_DB.prepare(`UPDATE staff SET calendar_color = ? WHERE id = ?`)
    .bind(calendarColor, staffId)
    .run();

  return new Response(JSON.stringify({ staffId, calendarColor }), {
    headers: { "content-type": "application/json" },
  });
}
