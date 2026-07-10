// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/shop/webhook
// Stripe calls this directly, not the browser. This is the real
// confirmation that money actually landed, the success page redirect
// alone can't be trusted, a person could land on it without ever
// paying. Needs the endpoint registered in the Stripe dashboard
// pointing at this URL, and STRIPE_WEBHOOK_SECRET set as a secret.

async function verifyStripeSignature(payload, header, secret) {
  const parts = header.split(",").reduce((acc, part) => {
    const [k, v] = part.split("=");
    acc[k] = v;
    return acc;
  }, {});

  const signedPayload = `${parts.t}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expected = Array.from(new Uint8Array(sigBuffer), (b) => b.toString(16).padStart(2, "0")).join("");

  return expected === parts.v1;
}

export async function onRequestPost({ request, env }) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  const valid = signature && (await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET));
  if (!valid) {
    return new Response("invalid signature", { status: 400 });
  }

  const event = JSON.parse(payload);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      await env.WATAG_DB.prepare(`UPDATE orders SET status = 'paid', stripe_payment_id = ? WHERE id = ?`)
        .bind(session.payment_intent, orderId)
        .run();

      const email = session.customer_details?.email;
      if (email && env.RESEND_API_KEY) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
          body: JSON.stringify({
            from: "WATAG <studio@watagapp.co.uk>",
            to: email,
            subject: "Order confirmed",
            text: `Your order's confirmed, ready to collect in studio. Order #${orderId}.`,
          }),
        });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "content-type": "application/json" } });
}
