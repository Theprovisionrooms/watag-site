// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// One-way toggle by design: once notifications are on, the tile locks
// itself out (disabled, no onClick) rather than staying wired up to
// unsubscribe. Sitting in the same nav grid as everything else meant
// a stray tap was turning notifications back off by accident. Turning
// them off again is still possible from the device's own notification
// settings, just not from a single mis-tap here.

import { BellIcon } from "./icons.jsx";
import { usePushNotifications } from "../hooks/usePushNotifications.js";

export default function NotificationToggle({ staffId }) {
  const { supported, subscribed, loading, subscribe } = usePushNotifications({ staffId });

  if (!supported) return null;

  return (
    <button
      onClick={subscribed ? undefined : subscribe}
      disabled={loading || subscribed}
      className="watag-nav-tile"
      style={{ border: "none", width: "100%", cursor: subscribed ? "default" : "pointer" }}
    >
      <span className="watag-nav-tile-icon" style={{ width: 48, height: 48 }}>
        <BellIcon />
      </span>
      <span className="watag-nav-tile-label">
        {loading ? "..." : subscribed ? "Notifications on" : "Turn on notifications"}
      </span>
    </button>
  );
}
