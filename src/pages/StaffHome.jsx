// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NavTile from "../components/NavTile.jsx";
import NotificationToggle from "../components/NotificationToggle.jsx";
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
  const [staffId, setStaffId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("watag_staff_id");
    if (!id) {
      navigate("/staff");
      return;
    }
    setStaffId(id);
    setName(localStorage.getItem("watag_staff_name") || "");
    setRole(localStorage.getItem("watag_staff_role") || "artist");
  }, [navigate]);

  return (
    <div className="watag-screen">
      <img src="/icons/icon-512.png" alt="" className="watag-hero-rabbit" style={{ width: 64, height: 64 }} />
      <span className="watag-eyebrow" style={{ alignSelf: "center" }}>Artist</span>
      <h1 style={{ textAlign: "center" }}>Hey {name}</h1>

      <div className="watag-nav-grid">
        <NavTile index={0} to="/staff/profile" icon={<ProfileIcon />} label="My profile" />
        <NavTile index={1} to="/staff/scan" icon={<ScanIcon />} label="Scan loyalty card" />
        <NavTile index={2} to="/staff/gallery" icon={<GalleryIcon />} label="My gallery" />
        <NavTile index={3} to="/staff/availability" icon={<ClockIcon />} label="My availability" />
        <NavTile index={4} to="/staff/messages" icon={<ChatIcon />} label="Enquiries" />
        <NavTile index={5} to="/staff/waitlist" icon={<ClockIcon />} label="Waitlist" />
        {role === "owner" && (
          <>
            <NavTile index={0} to="/staff/products" icon={<ShopBagIcon />} label="Manage shop" />
            <NavTile index={1} to="/staff/stats" icon={<ChartIcon />} label="Stats" />
          </>
        )}
        {staffId && <NotificationToggle staffId={staffId} />}
      </div>
    </div>
  );
}
