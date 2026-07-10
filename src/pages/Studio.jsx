// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Public gallery showing the inside of the studio. Deliberately not
// tied to the staff upload system, this is just a fixed set of shots
// Jay drops into /public/studio and lists below, no ackend needed.

import { NavBack } from "../App.jsx";
import GalleryCarousel from "../components/GalleryCarousel.jsx";

// add a filename here for each photo dropped into /public/studio
const STUDIO_IMAGES = ["image-1.jpg","image-2.jpg","image-3.jpg","image-4.jpg","image-5.jpg","image-6.jpg"
  // "chair-1.jpg",
  // "front-desk.jpg",
  // "wall-flash.jpg",
];

export default function Studio() {
  return (
    <div className="watag-screen">
      <NavBack />
      <h1>Inside the studio</h1>

      <GalleryCarousel
        images={STUDIO_IMAGES.map((file) => ({ id: file, src: `/studio/${file}`, alt: "" }))}
        emptyMessage="photos coming soon"
      />
    </div>
  );
}
