// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/reviews/request
// Header: Authorization: Bearer <staff session token>
// Body: { clientId }
// Sends an email asking for a Google review, with a link that goes
// through our own redirect first so we know if it was actually clicked.

import { resolveStaffSession } from "../../_lib/session.js";

const GOOGLE_REVIEW_URL = "https://g.page/r/CYEZZgWtNcfBEAE/review";
const RESEND_FROM = "WATAG <studio@watagapp.co.uk>";

export async function onRequestPost({ request, env }) {
  const staffId = await resolveStaffSession(request, env);
  if (!staffId) {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { clientId } = await request.json();

  if (!clientId) {
    return new Response(JSON.stringify({ error: "clientId is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const client = await env.WATAG_DB.prepare(`SELECT name, email FROM clients WHERE id = ?`)
    .bind(clientId)
    .first();

  if (!client) {
    return new Response(JSON.stringify({ error: "client_not_found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const result = await env.WATAG_DB.prepare(`INSERT INTO review_nudges (client_id) VALUES (?)`)
    .bind(clientId)
    .run();

  const nudgeId = result.meta.last_row_id;
  const origin = new URL(request.url).origin;
  const trackedLink = `${origin}/api/reviews/click?id=${nudgeId}`;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: client.email,
      subject: "How was it?",
      text: `Hey ${client.name}, hope you're happy with the new ink. If you've got a minute, a review really helps us out: ${trackedLink}`,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text();
    console.error("review nudge email failed", resendRes.status, detail);
    return new Response(JSON.stringify({ error: "email_send_failed", detail }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ sent: true }), {
    headers: { "content-type": "application/json" },
  });
}
