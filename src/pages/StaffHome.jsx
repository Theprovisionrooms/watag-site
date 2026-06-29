// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NavTile from "../components/NavTile.jsx";
import {
  ProfileIcon,
  ScanIcon,
  GalleryIcon,
  ClockIcon,
  ChatIcon,
  ShopBagIcon,
  ChartIcon,
} from "../components/icons.jsx";

export default function StaffHome() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState("artist");

  useEffect(() => {
    const staffId = localStorage.getItem("watag_staff_id");
    if (!staffId) {
      navigate("/staff");
      return;
    }
    setName(localStorage.getItem("watag_staff_name") || "");
    setRole(localStorage.getItem("watag_staff_role") || "artist");
  }, [navigate]);

  return (
    <div className="watag-screen">
      <img src="/icons/icon-512.png" alt="" className="watag-hero-rabbit" style={{ width: 64, height: 64 }} />
      <span className="watag-eyebrow" style={{ alignSelf: "center" }}>Artist</span>
      <h1 style={{ textAlign: "center" }}>Hey {name}</h1>

      <div className="watag-nav-grid">
        <NavTile to="/staff/profile" icon={<ProfileIcon />} label="My profile" />
        <NavTile to="/staff/scan" icon={<ScanIcon />} label="Scan loyalty card" />
        <NavTile to="/staff/gallery" icon={<GalleryIcon />} label="My gallery" />
        <NavTile to="/staff/availability" icon={<ClockIcon />} label="My availability" />
        <NavTile to="/staff/messages" icon={<ChatIcon />} label="Enquiries" />
        <NavTile to="/staff/waitlist" icon={<ClockIcon />} label="Waitlist" />
        {role === "owner" && (
          <>
            <NavTile to="/staff/products" icon={<ShopBagIcon />} label="Manage shop" />
            <NavTile to="/staff/stats" icon={<ChartIcon />} label="Stats" />
          </>
        )}
      </div>
    </div>
  );
}
