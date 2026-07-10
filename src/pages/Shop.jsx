// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Cart lives in memory only, clears on refresh, fine for a small shop
// where the journey is browse then buy in one sitting.

import { useEffect, useState } from "react";
import { NavBack } from "../App.jsx";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({}); // productId -> quantity
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/shop/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  function add(productId) {
    setCart((c) => ({ ...c, [productId]: (c[productId] || 0) + 1 }));
  }
  function remove(productId) {
    setCart((c) => {
      const next = { ...c };
      if (next[productId] > 1) next[productId] -= 1;
      else delete next[productId];
      return next;
    });
  }

  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = products.find((p) => String(p.id) === productId);
    return { product, quantity };
  });
  const totalCents = cartItems.reduce((sum, i) => sum + (i.product?.price_cents || 0) * i.quantity, 0);

  async function checkout() {
    setError(null);
    setCheckingOut(true);
    try {
      const token = localStorage.getItem("watag_session_token");
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items: cartItems.map((i) => ({ productId: Number(i.product.id), quantity: i.quantity })) }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        // server didn't return JSON at all, a crash or a Cloudflare
        // error page, either way there's nothing usable to redirect to
        throw new Error(`checkout failed (${res.status})`);
      }

      if (!res.ok) {
        setError(data.detail || data.error || "checkout didn't go through, try again");
        return;
      }
      if (!data.url) {
        setError("checkout didn't go through, try again");
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError("checkout didn't go through, try again");
      console.error("checkout error", err);
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="watag-screen">
      <NavBack />
      <h1>Merch</h1>
      <p style={{ color: "var(--watag-text-dim)" }}>Pay online, collect in studio, no postage on this one.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {products.map((p) => (
          <div key={p.id} className="watag-card" style={{ padding: 0, overflow: "hidden" }}>
            {p.image_url && (
              <img src={`/media/${p.image_url}`} alt={p.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
            )}
            <div style={{ padding: 12 }}>
              <strong style={{ fontSize: 14 }}>{p.name}</strong>
              <p style={{ margin: "4px 0 8px", color: "var(--watag-text-dim)", fontSize: 12 }}>£{(p.price_cents / 100).toFixed(2)}</p>
              {cart[p.id] ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => remove(p.id)} style={{ background: "var(--watag-bg)", border: "1px solid var(--watag-border)", color: "var(--watag-text)", borderRadius: 6, width: 28, height: 28 }}>-</button>
                  <span>{cart[p.id]}</span>
                  <button onClick={() => add(p.id)} style={{ background: "var(--watag-bg)", border: "1px solid var(--watag-border)", color: "var(--watag-text)", borderRadius: 6, width: 28, height: 28 }}>+</button>
                </div>
              ) : (
                <button onClick={() => add(p.id)} style={{ background: "var(--watag-pink)", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700 }}>
                  add
                </button>
              )}
            </div>
          </div>
        ))}
        {products.length === 0 && <p style={{ color: "var(--watag-text-dim)" }}>nothing in the shop yet</p>}
      </div>

      {cartItems.length > 0 && (
        <div className="watag-card" style={{ position: "sticky", bottom: 16 }}>
          <strong>Total: £{(totalCents / 100).toFixed(2)}</strong>
          {error && <p style={{ color: "var(--watag-pink)", fontSize: 13 }}>{error}</p>}
          <button
            onClick={checkout}
            disabled={checkingOut}
            style={{ width: "100%", marginTop: 10, background: "var(--watag-pink)", color: "#fff", border: "none", borderRadius: 8, padding: 14, fontWeight: 700 }}
          >
            {checkingOut ? "redirecting..." : "checkout"}
          </button>
        </div>
      )}
    </div>
  );
}
