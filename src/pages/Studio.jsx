// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Public gallery showing the inside of the studio. Deliberately not
// tied to the staff upload system, this is just a fixed set of shots
// Jay drops into /public/studio and lists below, no backend needed.

import { NavBack } from "../App.jsx";

// add a filename here for each photo dropped into /public/studio
const STUDIO_IMAGES = [
  // "chair-1.jpg",
  // "front-desk.jpg",
  // "wall-flash.jpg",
];

export default function Studio() {
  return (
    <div className="watag-screen">
      <NavBack />
      <h1>Inside the studio</h1>

      {STUDIO_IMAGES.length === 0 && (
        <p style={{ color: "var(--watag-text-dim)", textAlign: "center" }}>photos coming soon</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {STUDIO_IMAGES.map((file) => (
          <img
            key={file}
            src={`/studio/${file}`}
            alt=""
            style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10 }}
          />
        ))}
      </div>
    </div>
  );
}
