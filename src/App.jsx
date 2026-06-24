// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import ClientLoyaltyCard from "./pages/ClientLoyaltyCard.jsx";
import StaffLogin from "./pages/StaffLogin.jsx";
import StaffHome from "./pages/StaffHome.jsx";
import StaffScan from "./pages/StaffScan.jsx";
import StaffGallery from "./pages/StaffGallery.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/card" element={<ClientLoyaltyCard />} />
      <Route path="/staff" element={<StaffLogin />} />
      <Route path="/staff/home" element={<StaffHome />} />
      <Route path="/staff/scan" element={<StaffScan />} />
      <Route path="/staff/gallery" element={<StaffGallery />} />
    </Routes>
  );
}

export function NavBack({ to = "/", label = "back" }) {
  return (
    <Link to={to} style={{ fontSize: 13, color: "var(--watag-text-dim)", textDecoration: "none" }}>
      ← {label}
    </Link>
  );
}
