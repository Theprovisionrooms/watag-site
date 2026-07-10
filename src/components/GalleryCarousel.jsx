// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Swipeable gallery carousel, used for both the studio gallery and
// each artist's public gallery. Native scroll-snap rather than a drag
// library, that's what makes the swipe feel free on a phone, this
// isn't reinventing touch handling that the browser already does well.

import { useEffect, useRef, useState } from "react";

export default function GalleryCarousel({ images, emptyMessage }) {
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const most = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
        const idx = slideRefs.current.indexOf(most.target);
        if (idx !== -1) setActive(idx);
      },
      { root: track, threshold: [0.6] }
    );

    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [images]);

  function goTo(idx) {
    const el = slideRefs.current[idx];
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
  }

  if (images.length === 0) {
    return <p style={{ color: "var(--watag-text-dim)", textAlign: "center" }}>{emptyMessage || "nothing uploaded yet"}</p>;
  }

  return (
    <div className="watag-carousel">
      <div className="watag-carousel-track" ref={trackRef}>
        {images.map((img, idx) => (
          <div
            className="watag-carousel-slide"
            key={img.id}
            ref={(el) => (slideRefs.current[idx] = el)}
          >
            <img src={img.src} alt={img.alt || ""} loading={idx === 0 ? "eager" : "lazy"} />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            className="watag-carousel-arrow watag-carousel-arrow-left"
            onClick={() => goTo(Math.max(0, active - 1))}
            aria-label="previous photo"
            disabled={active === 0}
          >
            ‹
          </button>
          <button
            className="watag-carousel-arrow watag-carousel-arrow-right"
            onClick={() => goTo(Math.min(images.length - 1, active + 1))}
            aria-label="next photo"
            disabled={active === images.length - 1}
          >
            ›
          </button>

          <div className="watag-carousel-dots">
            {images.map((img, idx) => (
              <button
                key={img.id}
                className={`watag-carousel-dot${idx === active ? " is-active" : ""}`}
                onClick={() => goTo(idx)}
                aria-label={`go to photo ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
