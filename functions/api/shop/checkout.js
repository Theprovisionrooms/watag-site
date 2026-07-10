// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/shop/checkout
// Body: { items: [{ productId, quantity }] }
// Optional Authorization: Bearer <session token>, ties the order to a
// client account if they're signed in, guest checkout works fine too.
//
// Prices are looked up server side from the products table, never
// trusted from the cart in the browser, stops a tampered request
// charging less than the real price.

import { resolveClientSession } from "../../_lib/session.js";

function toFormEncoded(obj, prefix = "") {
  const params = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      params.push(toFormEncoded(value, fullKey));
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item && typeof item === "object") {
          params.push(toFormEncoded(item, `${fullKey}[${i}]`));
        } else {
          params.push(`${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(item)}`);
        }
      });
    } else {
      params.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`);
    }
  }
  return params.join("&");
}

export async function onRequestPost({ request, env }) {
  let items;
  try {
    ({ items } = await request.json());
  } catch {
    return new Response(JSON.stringify({ error: "invalid request body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return new Response(JSON.stringify({ error: "items required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is not set on this Pages project");
    return new Response(JSON.stringify({ error: "checkout_failed", detail: "payments aren't configured yet" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const clientId = await resolveClientSession(request, env);

    const products = await Promise.all(
      items.map((i) =>
        env.WATAG_DB.prepare(`SELECT id, name, price_cents FROM products WHERE id = ? AND active = 1`).bind(i.productId).first()
      )
    );

    if (products.some((p) => !p)) {
      return new Response(JSON.stringify({ error: "one or more items are no longer available" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const totalCents = products.reduce((sum, p, i) => sum + p.price_cents * items[i].quantity, 0);

    const orderResult = await env.WATAG_DB.prepare(
      `INSERT INTO orders (client_id, total_cents, status) VALUES (?, ?, 'pending')`
    )
      .bind(clientId || null, totalCents)
      .run();

    const orderId = orderResult.meta.last_row_id;

    await Promise.all(
      products.map((p, i) =>
        env.WATAG_DB.prepare(
          `INSERT INTO order_items (order_id, product_id, quantity, price_cents) VALUES (?, ?, ?, ?)`
        )
          .bind(orderId, p.id, items[i].quantity, p.price_cents)
          .run()
      )
    );

    const origin = new URL(request.url).origin;

    const sessionParams = {
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop`,
      metadata: { order_id: String(orderId) },
      line_items: products.map((p, i) => ({
        quantity: items[i].quantity,
        price_data: {
          currency: "gbp",
          unit_amount: p.price_cents,
          product_data: { name: p.name },
        },
      })),
    };

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: toFormEncoded(sessionParams),
    });

    if (!stripeRes.ok) {
      const detail = await stripeRes.text();
      console.error("stripe session create failed", stripeRes.status, detail);
      return new Response(JSON.stringify({ error: "checkout_failed", detail }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    const session = await stripeRes.json();

    if (!session.url) {
      console.error("stripe session created but returned no url", session);
      return new Response(JSON.stringify({ error: "checkout_failed", detail: "no checkout url returned" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("checkout crashed", err);
    return new Response(JSON.stringify({ error: "checkout_failed", detail: "something went wrong, try again" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
