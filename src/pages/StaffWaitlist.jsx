// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Pending requests get approve/decline. Requests tied to a specific
// artist can only be actioned by that artist, the server enforces
// this too, this just avoids offering a button that would fail anyway.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";
import { staffAuthHeaders } from "../utils/staffAuth.js";

const STATUS_COLOR = { pending: "var(--watag-amber)", approved: "var(--watag-cyan)", declined: "var(--watag-text-dim)" };

export default function StaffWaitlist() {
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [acting, setActing] = useState(null);

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
    fetch(`/api/waitlist`, { headers: staffAuthHeaders() })
      .then((res) => res.json())
      .then(setEntries);
  }

  async function act(id, action) {
    setActing(id);
    await fetch("/api/waitlist", {
      method: "PATCH",
      headers: { "content-type": "application/json", ...staffAuthHeaders() },
      body: JSON.stringify({ id, action }),
    });
    setActing(null);
    load();
  }

  async function clear(id) {
    await fetch("/api/waitlist", {
      method: "DELETE",
      headers: { "content-type": "application/json", ...staffAuthHeaders() },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="watag-screen">
      <NavBack to="/staff/home" label="artist" />
      <h1>Waitlist</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((e) => (
          <div key={e.id} className="watag-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <strong>{e.client_name}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--watag-text-dim)", fontSize: 13 }}>{e.client_phone}</p>
                <p style={{ margin: "4px 0 0", color: "var(--watag-amber)", fontSize: 13 }}>wants {e.requested_date}</p>
                {e.notes && <p style={{ margin: "4px 0 0", fontSize: 13 }}>{e.notes}</p>}
              </div>
              <span style={{ fontSize: 11, textTransform: "uppercase", color: STATUS_COLOR[e.status], flexShrink: 0 }}>
                {e.status}
              </span>
            </div>

            {e.status === "pending" ? (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => act(e.id, "approve")}
                  disabled={acting === e.id}
                  style={{ flex: 1, background: "var(--watag-cyan)", color: "#000", border: "none", borderRadius: 8, padding: 8, fontWeight: 700, fontSize: 13 }}
                >
                  approve
                </button>
                <button
                  onClick={() => act(e.id, "decline")}
                  disabled={acting === e.id}
                  style={{ flex: 1, background: "none", border: "1px solid var(--watag-border)", color: "var(--watag-text-dim)", borderRadius: 8, padding: 8, fontSize: 13 }}
                >
                  decline
                </button>
              </div>
            ) : (
              <button
                onClick={() => clear(e.id)}
                style={{ marginTop: 8, background: "none", border: "none", color: "var(--watag-text-dim)", fontSize: 12 }}
              >
                remove from list
              </button>
            )}
          </div>
        ))}
        {entries.length === 0 && <p style={{ color: "var(--watag-text-dim)", textAlign: "center" }}>nobody waiting right now</p>}
      </div>
    </div>
  );
}
