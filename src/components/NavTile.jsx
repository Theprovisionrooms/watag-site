// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// A press fires a quick RGB-split glitch on the icon, on top of the
// slow ambient pulse every tile already has. `index` staggers that
// ambient pulse so a row of tiles doesn't breathe in lockstep, reads
// as more alive rather than a uniform animation.

import { useState } from "react";
import { Link } from "react-router-dom";

export default function NavTile({ to, icon, label, index = 0 }) {
  const [glitching, setGlitching] = useState(false);

  function triggerGlitch() {
    setGlitching(true);
    setTimeout(() => setGlitching(false), 320);
  }

  return (
    <Link
      to={to}
      className="watag-nav-tile"
      onPointerDown={triggerGlitch}
      style={{ "--watag-tile-delay": `${(index % 6) * 0.35}s` }}
    >
      <span className={`watag-nav-tile-icon ${glitching ? "watag-icon-glitch" : ""}`}>{icon}</span>
      <span className="watag-nav-tile-label">{label}</span>
    </Link>
  );
}
