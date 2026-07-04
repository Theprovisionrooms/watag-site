// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Landing here doesn't prove payment went through, the webhook is
// the real confirmation, this is just the reassurance screen for
// whoever lands here after a successful Stripe redirect.

import { Link } from "react-router-dom";

export default function ShopSuccess() {
  return (
    <div className="watag-screen">
      <h1>Sorted</h1>
      <p style={{ color: "var(--watag-text-dim)" }}>
        You'll get a confirmation email shortly. Ready to collect in studio.
      </p>
      <Link to="/" style={{ color: "var(--watag-pink)", fontWeight: 600 }}>
        back to home →
      </Link>
    </div>
  );
}
