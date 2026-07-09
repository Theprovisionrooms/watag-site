// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";
import { staffAuthHeaders } from "../utils/staffAuth.js";

export default function StaffInbox() {
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState(null);
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    const id = localStorage.getItem("watag_staff_id");
    const token = localStorage.getItem("watag_staff_token");
    if (!id || !token) {
      navigate("/staff");
      return;
    }
    setStaffId(id);
    load();
  }, [navigate]);

  function load() {
    fetch(`/api/enquiries/threads`, { headers: staffAuthHeaders() })
      .then((res) => res.json())
      .then(setThreads);
  }

  return (
    <div className="watag-screen">
      <NavBack to="/staff/home" label="artist" />
      <h1>Enquiries</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {threads.map((t) => (
          <div
            key={t.id}
            className="watag-card"
            onClick={() => navigate(`/staff/messages/${t.id}`)}
            style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <strong>{t.other_name}</strong>
              {t.other_phone && (
                <span style={{ display: "block", fontSize: 12, color: "var(--watag-cyan)" }}>{t.other_phone}</span>
              )}
              <p style={{ margin: "4px 0 0", color: "var(--watag-text-dim)", fontSize: 13 }}>{t.lastMessage || "no messages yet"}</p>
            </div>
            {t.unreadCount > 0 && (
              <span style={{ background: "var(--watag-cyan)", color: "#000", borderRadius: 999, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>
                {t.unreadCount}
              </span>
            )}
          </div>
        ))}
        {threads.length === 0 && <p style={{ color: "var(--watag-text-dim)", textAlign: "center" }}>nothing yet</p>}
      </div>
    </div>
  );
}
