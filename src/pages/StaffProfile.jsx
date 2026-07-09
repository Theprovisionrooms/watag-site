// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Artist edits their own public profile here, this is what feeds the
// client facing directory directly.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";
import { staffAuthHeaders } from "../utils/staffAuth.js";

export default function StaffProfile() {
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [staffId, setStaffId] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [color, setColor] = useState("#E91E8C");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinError, setPinError] = useState(null);
  const [pinSaving, setPinSaving] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("watag_staff_id");
    const token = localStorage.getItem("watag_staff_token");
    if (!id || !token) {
      navigate("/staff");
      return;
    }
    setStaffId(id);
    fetch(`/api/staff/profile?staffId=${id}`)
      .then((res) => res.json())
      .then((data) => {
        setName(data.name || "");
        setBio(data.bio || "");
        setColor(data.calendar_color || "#E91E8C");
        setPhotoUrl(data.photo_url || null);
      });
  }, [navigate]);

  async function save() {
    setSaving(true);
    setSaved(false);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("bio", bio);
    formData.append("calendarColor", color);
    if (fileInput.current.files[0]) formData.append("photo", fileInput.current.files[0]);

    const res = await fetch("/api/staff/profile", { method: "POST", headers: staffAuthHeaders(), body: formData });
    const data = await res.json();
    if (data.photoUrl) setPhotoUrl(data.photoUrl);
    localStorage.setItem("watag_staff_name", name);
    localStorage.setItem("watag_staff_color", color);
    setSaving(false);
    setSaved(true);
  }

  async function changePin() {
    setPinError(null);
    setPinSaved(false);
    setPinSaving(true);
    const res = await fetch("/api/staff/change-pin", {
      method: "POST",
      headers: { "content-type": "application/json", ...staffAuthHeaders() },
      body: JSON.stringify({ currentPin, newPin }),
    });
    const data = await res.json();
    setPinSaving(false);
    if (!res.ok) {
      setPinError(data.error || "couldn't change it, try again");
      return;
    }
    setCurrentPin("");
    setNewPin("");
    setPinSaved(true);

    // a changed PIN invalidates every session on the account, this one
    // included, sign out locally and send them back to log in fresh
    setTimeout(() => {
      localStorage.removeItem("watag_staff_token");
      localStorage.removeItem("watag_staff_id");
      localStorage.removeItem("watag_staff_name");
      localStorage.removeItem("watag_staff_color");
      localStorage.removeItem("watag_staff_role");
      navigate("/staff");
    }, 1500);
  }

  return (
    <div className="watag-screen">
      <NavBack to="/staff/home" label="artist" />
      <h1>My profile</h1>
      <p style={{ color: "var(--watag-text-dim)" }}>This is what clients see about you on the artist page.</p>

      <div className="watag-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {photoUrl && (
          <img src={`/media/${photoUrl}`} alt="" style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", alignSelf: "center" }} />
        )}
        <input ref={fileInput} type="file" accept="image/*" style={{ color: "var(--watag-text-dim)" }} />

        <input
          placeholder="your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8 }}
        />
        <textarea
          placeholder="a couple of lines about you, your style, what you love tattooing"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8, resize: "vertical", fontFamily: "inherit" }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "var(--watag-text-dim)" }}>Calendar colour</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: 44, height: 32, border: "none", borderRadius: 6, background: "none" }}
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          style={{ background: color, color: "#000", border: "none", borderRadius: 8, padding: 12, fontWeight: 700 }}
        >
          {saving ? "saving..." : saved ? "saved" : "save profile"}
        </button>
      </div>

      <div className="watag-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <strong>Change your PIN</strong>
        <input
          type="password"
          inputMode="numeric"
          placeholder="current PIN"
          value={currentPin}
          onChange={(e) => setCurrentPin(e.target.value)}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8, letterSpacing: 2 }}
        />
        <input
          type="password"
          inputMode="numeric"
          placeholder="new PIN, at least 4 digits"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8, letterSpacing: 2 }}
        />
        {pinError && <span style={{ color: "var(--watag-pink)", fontSize: 13 }}>{pinError}</span>}
        <button
          onClick={changePin}
          disabled={pinSaving || !currentPin || !newPin}
          style={{ background: "none", border: "1px solid var(--watag-cyan)", color: "var(--watag-cyan)", borderRadius: 8, padding: 12, fontWeight: 700 }}
        >
          {pinSaving ? "updating..." : pinSaved ? "PIN updated" : "change PIN"}
        </button>
      </div>
    </div>
  );
}
