// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="watag-screen">
      <span className="watag-eyebrow">WATAG · Southport</span>
      <h1 style={{ fontSize: 40 }}>WATAG</h1>
      <p style={{ color: "var(--watag-text-dim)" }}>
        Loyalty card, gallery, bookings and shop, all in one place.
      </p>
      <div className="watag-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Link to="/card" style={{ color: "var(--watag-pink)", fontWeight: 600 }}>
          View your loyalty card →
        </Link>
        <Link to="/artists" style={{ color: "var(--watag-amber)", fontWeight: 600 }}>
          Meet the artists →
        </Link>
        <Link to="/calendar" style={{ color: "var(--watag-amber)", fontWeight: 600 }}>
          See who's working →
        </Link>
        <Link to="/messages" style={{ color: "var(--watag-purple)", fontWeight: 600 }}>
          Message an artist →
        </Link>
        <Link to="/shop" style={{ color: "var(--watag-cyan)", fontWeight: 600 }}>
          Shop merch →
        </Link>
        <Link to="/staff" style={{ color: "var(--watag-cyan)", fontWeight: 600 }}>
          Artist login →
        </Link>
      </div>
    </div>
  );
}
