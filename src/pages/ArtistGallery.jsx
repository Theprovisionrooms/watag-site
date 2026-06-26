// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Public read-only view of one artist's gallery, reuses the same
// data the artist uploads to from their own gallery management page.

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { NavBack } from "../App.jsx";

export default function ArtistGallery() {
  const { staffId } = useParams();
  const [artist, setArtist] = useState(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch("/api/staff/list")
      .then((res) => res.json())
      .then((list) => setArtist(list.find((a) => String(a.id) === staffId)));
    fetch(`/api/staff/gallery?staffId=${staffId}`)
      .then((res) => res.json())
      .then(setImages);
  }, [staffId]);

  return (
    <div className="watag-screen">
      <NavBack to="/artists" label="artists" />
      <h1>{artist?.name || "Gallery"}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {images.map((img) => (
          <img
            key={img.id}
            src={`/media/${img.image_url}`}
            alt={img.caption || ""}
            style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10 }}
          />
        ))}
      </div>

      {images.length === 0 && <p style={{ color: "var(--watag-text-dim)", textAlign: "center" }}>nothing uploaded yet</p>}
    </div>
  );
}
