// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Staff set their own availability blocks and pick their own calendar
// colour here. Both feed straight into the client facing rota view.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function StaffAvailability() {
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState(null);
  const [color, setColor] = useState("#E91E8C");
  const [blocks, setBlocks] = useState([]);
  const [form, setForm] = useState({ date: todayISO(), startTime: "10:00", endTime: "18:00", status: "available" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("watag_staff_id");
    if (!id) {
      navigate("/staff");
      return;
    }
    setStaffId(id);
    setColor(localStorage.getItem("watag_staff_color") || "#E91E8C");
    loadBlocks(id);
  }, [navigate]);

  async function loadBlocks(id) {
    const res = await fetch(`/api/staff/availability?staffId=${id}&from=${todayISO()}&to=${addDaysISO(30)}`);
    if (res.ok) setBlocks(await res.json());
  }

  async function addBlock() {
    setSaving(true);
    await fetch("/api/staff/availability", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ staffId, ...form }),
    });
    setSaving(false);
    loadBlocks(staffId);
  }

  async function removeBlock(id) {
    await fetch("/api/staff/availability", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadBlocks(staffId);
  }

  return (
    <div className="watag-screen">
      <NavBack to="/staff/home" label="artist" />
      <h1>My availability</h1>
      <p style={{ color: "var(--watag-text-dim)", fontSize: 13, margin: 0 }}>
        Want to change your colour, name, or bio? That's on <a href="/staff/profile" style={{ color: "var(--watag-cyan)" }}>my profile</a> now.
      </p>

      <div className="watag-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <strong>Add a slot</strong>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            style={{ flex: 1, background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8 }}
          />
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            style={{ flex: 1, background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8 }}
          />
        </div>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8 }}
        >
          <option value="available">available</option>
          <option value="booked">booked</option>
          <option value="off">off</option>
        </select>
        <button
          onClick={addBlock}
          disabled={saving}
          style={{ background: color, color: "#000", border: "none", borderRadius: 8, padding: "12px", fontWeight: 700 }}
        >
          {saving ? "saving..." : "add slot"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {blocks.map((b) => (
          <div
            key={b.id}
            className="watag-card"
            style={{ borderLeft: `4px solid ${color}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span>
              {b.date} · {b.start_time}–{b.end_time} · {b.status}
            </span>
            <button onClick={() => removeBlock(b.id)} style={{ background: "none", border: "none", color: "var(--watag-text-dim)" }}>
              remove
            </button>
          </div>
        ))}
        {blocks.length === 0 && <p style={{ color: "var(--watag-text-dim)", textAlign: "center" }}>no slots added yet</p>}
      </div>
    </div>
  );
}
