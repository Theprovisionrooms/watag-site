// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/clients/request-code
// Body: { email }
// Sends a 6 digit code valid for 10 minutes. Needs RESEND_API_KEY set
// as a secret, sending from the verified studio domain below.

const CODE_TTL_MINUTES = 10;
const RESEND_FROM = "WATAG <studio@watagapp.co.uk>";

export async function onRequestPost({ request, env }) {
  const { email } = await request.json();

  if (!email || !email.includes("@")) {
    return new Response(JSON.stringify({ error: "a valid email is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  await env.WATAG_DB.prepare(
    `INSERT INTO client_verification_codes (email, code, expires_at) VALUES (?, ?, ?)`
  )
    .bind(cleanEmail, code, expiresAt)
    .run();

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: cleanEmail,
      subject: "Your WATAG code",
      text: `Your code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.`,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text();
    console.error("resend send failed", resendRes.status, detail);
    return new Response(
      JSON.stringify({ error: "email_send_failed", detail }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ sent: true }), {
    headers: { "content-type": "application/json" },
  });
}
