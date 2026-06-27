// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

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
      <span className="watag-eyebrow">Artist</span>
      <h1>Hey {name}</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Link to="/staff/profile" className="watag-card" style={{ color: "var(--watag-pink)", fontWeight: 600, textDecoration: "none" }}>
          My profile →
        </Link>
        <Link to="/staff/scan" className="watag-card" style={{ color: "var(--watag-pink)", fontWeight: 600, textDecoration: "none" }}>
          Scan loyalty card →
        </Link>
        <Link to="/staff/gallery" className="watag-card" style={{ color: "var(--watag-cyan)", fontWeight: 600, textDecoration: "none" }}>
          My gallery →
        </Link>
        <Link to="/staff/availability" className="watag-card" style={{ color: "var(--watag-amber)", fontWeight: 600, textDecoration: "none" }}>
          My availability →
        </Link>
        <Link to="/staff/messages" className="watag-card" style={{ color: "var(--watag-purple)", fontWeight: 600, textDecoration: "none" }}>
          Enquiries →
        </Link>
        <Link to="/staff/waitlist" className="watag-card" style={{ color: "var(--watag-amber)", fontWeight: 600, textDecoration: "none" }}>
          Waitlist →
        </Link>
        {role === "owner" && (
          <>
            <Link to="/staff/products" className="watag-card" style={{ color: "var(--watag-cyan)", fontWeight: 600, textDecoration: "none" }}>
              Manage shop →
            </Link>
            <Link to="/staff/stats" className="watag-card" style={{ color: "var(--watag-pink)", fontWeight: 600, textDecoration: "none" }}>
              Stats →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
