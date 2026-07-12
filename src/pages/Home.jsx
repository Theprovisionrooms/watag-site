// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import NavTile from "../components/NavTile.jsx";
import NotificationToggle from "../components/NotificationToggle.jsx";
import {
  LoyaltyCardIcon,
  SunglassesIcon,
  CalendarIcon,
  ShopBagIcon,
  GiftIcon,
  AftercareIcon,
  CameraIcon,
  ChatIcon,
} from "../components/icons.jsx";

export default function Home() {
  // one-off glitch flash on the rabbit as the page loads, this is the
  // "fluff" moment, deliberately not a loop, fires once and settles
  const [heroGlitch, setHeroGlitch] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setHeroGlitch(false), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="watag-screen">
      <img
        src="/icons/rabbit-hero.png"
        alt="WATAG"
        className={`watag-hero-rabbit ${heroGlitch ? "watag-glitch-once" : ""}`}
      />
      <img src="/icons/wordmark.png" alt="WATAG" className="watag-wordmark" />

      <div className="watag-nav-grid">
        <NavTile index={0} to="/card" icon={<LoyaltyCardIcon />} label="Loyalty card" />
        <NavTile index={1} to="/artists" icon={<SunglassesIcon />} label="Meet the artists" />
        <NavTile index={2} to="/calendar" icon={<CalendarIcon />} label="Who's working" />
        <NavTile index={3} to="/shop" icon={<ShopBagIcon />} label="Shop merch" />
        <NavTile index={4} to="/referrals" icon={<GiftIcon />} label="Refer a friend" />
        <NavTile index={5} to="/aftercare" icon={<AftercareIcon />} label="Aftercare guide" />
        <NavTile index={6} to="/studio" icon={<CameraIcon />} label="Inside the studio" />
        <NavTile index={7} to="/messages" icon={<ChatIcon />} label="Inbox" />
        <NotificationToggle />
      </div>

      <Link
        to="/staff"
        style={{
          alignSelf: "center",
          fontSize: 11,
          color: "var(--watag-text-dim)",
          opacity: 0.6,
          textDecoration: "none",
          marginTop: 8,
        }}
      >
        artist login
      </Link>

      <Link
        to="/legal"
        style={{
          alignSelf: "center",
          fontSize: 11,
          color: "var(--watag-text-dim)",
          opacity: 0.6,
          textDecoration: "none",
        }}
      >
        privacy & cookies
      </Link>
    </div>
  );
}
