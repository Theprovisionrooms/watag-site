// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Each staff member manages their own gallery here. Images go to R2,
// served back out through /media/<key> rather than a public bucket url.

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";
import { staffAuthHeaders } from "../utils/staffAuth.js";

export default function StaffGallery() {
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [staffId, setStaffId] = useState(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("watag_staff_id");
    const token = localStorage.getItem("watag_staff_token");
    if (!id || !token) {
      navigate("/staff");
      return;
    }
    setStaffId(id);
    loadImages(id);
  }, [navigate]);

  async function loadImages(id) {
    const res = await fetch(`/api/staff/gallery?staffId=${id}`);
    if (res.ok) setImages(await res.json());
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    await fetch("/api/staff/gallery", { method: "POST", headers: staffAuthHeaders(), body: formData });
    fileInput.current.value = "";
    setUploading(false);
    loadImages(staffId);
  }

  async function handleDelete(imageId) {
    await fetch("/api/staff/gallery", {
      method: "DELETE",
      headers: { "content-type": "application/json", ...staffAuthHeaders() },
      body: JSON.stringify({ imageId }),
    });
    loadImages(staffId);
  }

  return (
    <div className="watag-screen">
      <NavBack to="/staff/home" label="artist" />
      <h1>My gallery</h1>

      <button
        onClick={() => fileInput.current.click()}
        disabled={uploading}
        style={{ background: "var(--watag-cyan)", color: "#000", border: "none", borderRadius: 10, padding: "14px", fontWeight: 700 }}
      >
        {uploading ? "uploading..." : "add a photo"}
      </button>
      <input ref={fileInput} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {images.map((img) => (
          <div key={img.id} className="watag-card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
            <img src={`/media/${img.image_url}`} alt={img.caption || ""} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
            <button
              onClick={() => handleDelete(img.id)}
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                background: "rgba(10,10,18,0.8)",
                color: "var(--watag-pink)",
                border: "1px solid var(--watag-pink)",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 12,
              }}
            >
              remove
            </button>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <p style={{ color: "var(--watag-text-dim)", textAlign: "center" }}>no photos yet, add your first one above</p>
      )}
    </div>
  );
}
