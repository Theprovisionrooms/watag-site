// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { Link } from "react-router-dom";

export default function NavTile({ to, icon, label }) {
  return (
    <Link to={to} className="watag-nav-tile">
      <span className="watag-nav-tile-icon">{icon}</span>
      <span className="watag-nav-tile-label">{label}</span>
    </Link>
  );
}
