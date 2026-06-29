// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import ClientLoyaltyCard from "./pages/ClientLoyaltyCard.jsx";
import Calendar from "./pages/Calendar.jsx";
import Waitlist from "./pages/Waitlist.jsx";
import ClientMessages from "./pages/ClientMessages.jsx";
import ClientThread from "./pages/ClientThread.jsx";
import Artists from "./pages/Artists.jsx";
import ArtistGallery from "./pages/ArtistGallery.jsx";
import Referrals from "./pages/Referrals.jsx";
import ReferralLanding from "./pages/ReferralLanding.jsx";
import Shop from "./pages/Shop.jsx";
import ShopSuccess from "./pages/ShopSuccess.jsx";
import StaffLogin from "./pages/StaffLogin.jsx";
import StaffHome from "./pages/StaffHome.jsx";
import StaffProfile from "./pages/StaffProfile.jsx";
import StaffScan from "./pages/StaffScan.jsx";
import StaffGallery from "./pages/StaffGallery.jsx";
import StaffAvailability from "./pages/StaffAvailability.jsx";
import StaffInbox from "./pages/StaffInbox.jsx";
import StaffThread from "./pages/StaffThread.jsx";
import StaffProducts from "./pages/StaffProducts.jsx";
import StaffWaitlist from "./pages/StaffWaitlist.jsx";
import StaffStats from "./pages/StaffStats.jsx";
import InstallPrompt from "./components/InstallPrompt.jsx";

export default function App() {
  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="watagIconGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--watag-pink)" />
            <stop offset="100%" stopColor="var(--watag-cyan)" />
          </linearGradient>
        </defs>
      </svg>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/card" element={<ClientLoyaltyCard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/messages" element={<ClientMessages />} />
        <Route path="/messages/:threadId" element={<ClientThread />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/artists/:staffId/gallery" element={<ArtistGallery />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/r/:code" element={<ReferralLanding />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/success" element={<ShopSuccess />} />
        <Route path="/staff" element={<StaffLogin />} />
        <Route path="/staff/home" element={<StaffHome />} />
        <Route path="/staff/profile" element={<StaffProfile />} />
        <Route path="/staff/scan" element={<StaffScan />} />
        <Route path="/staff/gallery" element={<StaffGallery />} />
        <Route path="/staff/availability" element={<StaffAvailability />} />
        <Route path="/staff/messages" element={<StaffInbox />} />
        <Route path="/staff/messages/:threadId" element={<StaffThread />} />
        <Route path="/staff/products" element={<StaffProducts />} />
        <Route path="/staff/waitlist" element={<StaffWaitlist />} />
        <Route path="/staff/stats" element={<StaffStats />} />
      </Routes>
      <InstallPrompt />
    </>
  );
}

export function NavBack({ to = "/", label = "back" }) {
  return (
    <Link to={to} style={{ fontSize: 13, color: "var(--watag-text-dim)", textDecoration: "none" }}>
      ← {label}
    </Link>
  );
}
