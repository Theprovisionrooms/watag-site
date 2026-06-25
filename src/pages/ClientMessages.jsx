// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Client message hub. Shows existing threads and lets a client start
// a new one with any staff member.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";

export default function ClientMessages() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [threads, setThreads] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem("watag_session_token");
    if (!t) {
      navigate("/card");
      return;
    }
    setToken(t);
    fetch("/api/enquiries/threads", { headers: { Authorization: `Bearer ${t}` } })
      .then((res) => res.json())
      .then(setThreads);
    fetch("/api/staff/list")
      .then((res) => res.json())
      .then(setStaff);
  }, [navigate]);

  async function startThread(staffId) {
    const res = await fetch("/api/enquiries/start", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ staffId }),
    });
    const data = await res.json();
    navigate(`/messages/${data.threadId}`);
  }

  const threadedStaffIds = new Set(); // not strictly needed but keeps the "message" list honest if extended later

  return (
    <div className="watag-screen">
      <NavBack to="/" label="home" />
      <span className="watag-eyebrow">Messages</span>
      <h1>Your conversations</h1>

      {threads.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {threads.map((t) => (
            <div
              key={t.id}
              className="watag-card"
              onClick={() => navigate(`/messages/${t.id}`)}
              style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <strong>{t.other_name}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--watag-text-dim)", fontSize: 13 }}>{t.lastMessage || "say hello"}</p>
              </div>
              {t.unreadCount > 0 && (
                <span style={{ background: "var(--watag-pink)", color: "#000", borderRadius: 999, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>
                  {t.unreadCount}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <span className="watag-eyebrow">Message an artist</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {staff.map((s) => (
            <button
              key={s.id}
              onClick={() => startThread(s.id)}
              className="watag-card"
              style={{ textAlign: "left", color: "var(--watag-text)", border: "1px solid var(--watag-border)", display: "flex", alignItems: "center", gap: 10 }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.calendar_color }} />
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
