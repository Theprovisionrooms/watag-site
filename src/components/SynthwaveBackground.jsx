// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Fixed full-screen synthwave backdrop. Sits behind every screen via
// the App-level mount, never scrolls with content. The grid's motion
// is a looping background-position animation under a perspective
// transform, classic synthwave floor effect, not a video or a heavy
// asset, just CSS.

import { useMemo } from "react";

export default function SynthwaveBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: 50 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 55,
        r: Math.random() * 1.2 + 0.3,
        o: Math.random() * 0.6 + 0.3,
      })),
    []
  );

  return (
    <div className="watag-synth-bg" aria-hidden="true">
      <div className="watag-synth-sky">
        <svg className="watag-synth-stars" width="100%" height="100%">
          {stars.map((s, i) => (
            <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" opacity={s.o} />
          ))}
        </svg>
      </div>
      <div className="watag-synth-horizon" />
      <div className="watag-synth-grid-wrap">
        <div className="watag-synth-grid" />
      </div>
    </div>
  );
}
