// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Staff pick their own name then enter their PIN. With 3 staff this is
// simpler than a username field, swap for proper accounts if the team grows.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";

// placeholder roster, replace ids/names once seeded for real
const STAFF_ROSTER = [
  { id: 1, name: "Staff One" },
  { id: 2, name: "Staff Two" },
  { id: 3, name: "Staff Three" },
];

export default function StaffLogin() {
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submit = async () => {
    setError(null);
    const res = await fetch("/api/staff/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ staffId: selected.id, pin }),
    });
    if (!res.ok) {
      setError("wrong pin, try again");
      return;
    }
    const data = await res.json();
    localStorage.setItem("watag_staff_id", data.staffId);
    localStorage.setItem("watag_staff_name", data.name);
    localStorage.setItem("watag_staff_color", data.calendarColor);
    navigate("/staff/scan");
  };

  if (!selected) {
    return (
      <div className="watag-screen">
        <NavBack />
        <h1>Who's on</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {STAFF_ROSTER.map((s) => (
            <button
              key={s.id}
              className="watag-card"
              style={{ textAlign: "left", color: "var(--watag-text)", border: "1px solid var(--watag-border)" }}
              onClick={() => setSelected(s)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="watag-screen">
      <NavBack to="/staff" label={selected.name} />
      <h1>Enter PIN</h1>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="watag-card"
        style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 12, fontSize: 20, letterSpacing: 4, textAlign: "center" }}
      />
      {error && <p style={{ color: "var(--watag-pink)" }}>{error}</p>}
      <button
        onClick={submit}
        style={{ background: "var(--watag-pink)", color: "#fff", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700 }}
      >
        log in
      </button>
    </div>
  );
}
