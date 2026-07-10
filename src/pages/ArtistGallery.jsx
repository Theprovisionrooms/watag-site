// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Public read-only view of one artist's gallery, reuses the same
// data the artist uploads to from their own gallery management page.

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { NavBack } from "../App.jsx";
import GalleryCarousel from "../components/GalleryCarousel.jsx";

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

      <GalleryCarousel
        images={images.map((img) => ({ id: img.id, src: `/media/${img.image_url}`, alt: img.caption || "" }))}
      />
    </div>
  );
}
