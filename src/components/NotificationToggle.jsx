// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { BellIcon } from "./icons.jsx";
import { usePushNotifications } from "../hooks/usePushNotifications.js";

export default function NotificationToggle({ staffId }) {
  const { supported, subscribed, loading, subscribe, unsubscribe } = usePushNotifications({ staffId });

  if (!supported) return null;

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      className="watag-nav-tile"
      style={{ border: "none", width: "100%" }}
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
