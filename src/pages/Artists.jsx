// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Public artist directory. Pulls straight from each artist's own
// profile (My profile page), so there's nothing for Jay to keep in
// sync by hand.

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { NavBack } from "../App.jsx";

function weekRange() {
  const today = new Date();
  const from = today.toISOString().slice(0, 10);
  const end = new Date(today);
  end.setDate(end.getDate() + 6);
  return { from, to: end.toISOString().slice(0, 10) };
}

export default function Artists() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [workingThisWeek, setWorkingThisWeek] = useState({});
  const [messaging, setMessaging] = useState(null);

  useEffect(() => {
    fetch("/api/staff/list")
      .then((res) => res.json())
      .then(async (list) => {
        setArtists(list);
        const { from, to } = weekRange();
        const flags = {};
        await Promise.all(
          list.map(async (a) => {
            const res = await fetch(`/api/staff/availability?staffId=${a.id}&from=${from}&to=${to}`);
            const blocks = res.ok ? await res.json() : [];
            flags[a.id] = blocks.some((b) => b.status !== "off");
          })
        );
        setWorkingThisWeek(flags);
      });
  }, []);

  async function message(staffId) {
    const token = localStorage.getItem("watag_session_token");
    if (!token) {
      navigate("/card");
      return;
    }
    setMessaging(staffId);
    const res = await fetch("/api/enquiries/start", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ staffId }),
    });
    const data = await res.json();
    setMessaging(null);
    navigate(`/messages/${data.threadId}`);
  }

  return (
    <div className="watag-screen">
      <NavBack />
      <span className="watag-eyebrow">Meet the team</span>
      <h1>Artists</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {artists.map((a) => (
          <div key={a.id} className="watag-card" style={{ display: "flex", gap: 12 }}>
            {a.photo_url ? (
              <img src={`/media/${a.photo_url}`} alt={a.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: a.calendar_color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#000" }}>
                {a.name?.[0]}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong>{a.name}</strong>
                {workingThisWeek[a.id] && (
                  <span style={{ fontSize: 11, color: "var(--watag-cyan)", border: "1px solid var(--watag-cyan)", borderRadius: 999, padding: "1px 8px" }}>
                    on this week
                  </span>
                )}
              </div>
              {a.bio && <p style={{ margin: "4px 0 8px", color: "var(--watag-text-dim)", fontSize: 13 }}>{a.bio}</p>}
              <div style={{ display: "flex", gap: 14, fontSize: 13 }}>
                <Link to={`/artists/${a.id}/gallery`} style={{ color: "var(--watag-cyan)", fontWeight: 600 }}>
                  view gallery
                </Link>
                <button
                  onClick={() => message(a.id)}
                  disabled={messaging === a.id}
                  style={{ background: "none", border: "none", color: "var(--watag-pink)", fontWeight: 600, fontSize: 13, padding: 0 }}
                >
                  {messaging === a.id ? "opening..." : "message"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
