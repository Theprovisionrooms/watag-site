// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Artist edits their own public profile here, this is what feeds the
// client facing directory directly.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";

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

  useEffect(() => {
    const id = localStorage.getItem("watag_staff_id");
    if (!id) {
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
    formData.append("staffId", staffId);
    formData.append("name", name);
    formData.append("bio", bio);
    formData.append("calendarColor", color);
    if (fileInput.current.files[0]) formData.append("photo", fileInput.current.files[0]);

    const res = await fetch("/api/staff/profile", { method: "POST", body: formData });
    const data = await res.json();
    if (data.photoUrl) setPhotoUrl(data.photoUrl);
    localStorage.setItem("watag_staff_name", name);
    localStorage.setItem("watag_staff_color", color);
    setSaving(false);
    setSaved(true);
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
    </div>
  );
}
