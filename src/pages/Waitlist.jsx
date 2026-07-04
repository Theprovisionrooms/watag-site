// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";

const STATUS_LABEL = { pending: "waiting to hear back", approved: "approved", declined: "not this time" };
const STATUS_COLOR = { pending: "var(--watag-amber)", approved: "var(--watag-cyan)", declined: "var(--watag-text-dim)" };

export default function Waitlist() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [artists, setArtists] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
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
    loadMine(t);
  }, [navigate]);

  function loadMine(t) {
    fetch("/api/waitlist", { headers: { Authorization: `Bearer ${t}` } })
      .then((res) => res.json())
      .then(setMyRequests);
  }

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
    loadMine(token);
  }

  const requestList = myRequests.length > 0 && (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
        {myRequests.map((r) => (
          <div key={r.id} className="watag-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: 14 }}>{r.requested_date}</strong>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--watag-text-dim)" }}>
                {r.artist_name ? r.artist_name : "any artist"}
              </p>
            </div>
            <span style={{ fontSize: 11, textTransform: "uppercase", color: STATUS_COLOR[r.status] }}>
              {STATUS_LABEL[r.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (done) {
    return (
      <div className="watag-screen">
        <NavBack />
        <h1>You're on the list</h1>
        <p style={{ color: "var(--watag-text-dim)" }}>We'll let you know as soon as the artist you asked for gets back to us.</p>
        {requestList}
      </div>
    );
  }

  return (
    <div className="watag-screen">
      <NavBack />
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

      {requestList}
    </div>
  );
}
