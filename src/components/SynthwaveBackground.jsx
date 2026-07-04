// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Fixed full-screen backdrop built around the client's own commissioned
// scene artwork (public/backgrounds/scene.webp), animated with a slow
// continuous drift and zoom rather than sitting static. A dark overlay
// gradient keeps foreground text legible against the bright centre of
// the artwork. Sits behind every screen via the App-level mount, never
// scrolls with content.

import { useMemo } from "react";

export default function SynthwaveBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 1.1 + 0.3,
        o: Math.random() * 0.5 + 0.25,
      })),
    []
  );

  return (
    <div className="watag-synth-bg" aria-hidden="true">
      <svg className="watag-synth-stars" width="100%" height="100%">
        {stars.map((s, i) => (
          <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" opacity={s.o} />
        ))}
      </svg>
      <div className="watag-scene-image" />
      <div className="watag-scene-overlay" />
    </div>
  );
}
