// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import NavTile from "../components/NavTile.jsx";
import {
  LoyaltyCardIcon,
  SunglassesIcon,
  CalendarIcon,
  ChatIcon,
  ShopBagIcon,
  GiftIcon,
  LoginBadgeIcon,
} from "../components/icons.jsx";

export default function Home() {
  return (
    <div className="watag-screen">
      <img src="/icons/icon-512.png" alt="WATAG" className="watag-hero-rabbit" />
      <span className="watag-eyebrow" style={{ alignSelf: "center" }}>WATAG · Southport</span>
      <h1 style={{ fontSize: 32, textAlign: "center" }}>WATAG</h1>
      <p style={{ color: "var(--watag-text-dim)", textAlign: "center", marginTop: -8 }}>
        Loyalty card, gallery, bookings and shop, all in one place.
      </p>

      <div className="watag-nav-grid">
        <NavTile to="/card" icon={<LoyaltyCardIcon />} label="Loyalty card" />
        <NavTile to="/artists" icon={<SunglassesIcon />} label="Meet the artists" />
        <NavTile to="/calendar" icon={<CalendarIcon />} label="Who's working" />
        <NavTile to="/messages" icon={<ChatIcon />} label="Message an artist" />
        <NavTile to="/shop" icon={<ShopBagIcon />} label="Shop merch" />
        <NavTile to="/referrals" icon={<GiftIcon />} label="Refer a friend" />
        <NavTile to="/staff" icon={<LoginBadgeIcon />} label="Artist login" />
      </div>
    </div>
  );
}
