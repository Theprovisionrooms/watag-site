// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";

export default function Waitlist() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [artists, setArtists] = useState([]);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("watag_session_token");
    if (!t) {
      navigate("/card");
      return;
    }
    setToken(t);
    fetch("/api/staff/list")
      .then((res) => res.json())
      .then(setArtists);
  }, [navigate]);

  async function submit() {
    if (!date) return;
    setSubmitting(true);
    await fetch("/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ staffId: staffId || null, requestedDate: date, notes }),
    });
    setSubmitting(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="watag-screen">
        <NavBack />
        <span className="watag-eyebrow">Waitlist</span>
        <h1>You're on the list</h1>
        <p style={{ color: "var(--watag-text-dim)" }}>We'll be in touch if a slot opens up.</p>
      </div>
    );
  }

  return (
    <div className="watag-screen">
      <NavBack />
      <span className="watag-eyebrow">Waitlist</span>
      <h1>Join the waitlist</h1>
      <p style={{ color: "var(--watag-text-dim)" }}>Don't see a slot that works? Let us know what you're after and we'll reach out if something opens up.</p>

      <div className="watag-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8 }}
        />
        <select
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8 }}
        >
          <option value="">any artist</option>
          {artists.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <textarea
          placeholder="anything that'll help, e.g. what you're after, how flexible you are"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8, resize: "vertical", fontFamily: "inherit" }}
        />
        <button
          onClick={submit}
          disabled={submitting || !date}
          style={{ background: "var(--watag-amber)", color: "#000", border: "none", borderRadius: 8, padding: 12, fontWeight: 700 }}
        >
          {submitting ? "joining..." : "join waitlist"}
        </button>
      </div>
    </div>
  );
}
