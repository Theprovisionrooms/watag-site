// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// One icon per nav destination, all sharing the same gradient stroke
// (defined once, globally, in App.jsx) so they read as one consistent
// set rather than mismatched clip art. Kept geometrically simple on
// purpose, clean line work over anything fussy.

const base = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "url(#watagIconGradient)",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function LoyaltyCardIcon() {
  return (
    <svg {...base}>
      <rect x="5" y="11" width="38" height="26" rx="5" />
      <circle cx="16" cy="30" r="2.6" fill="url(#watagIconGradient)" />
      <circle cx="24" cy="30" r="2.6" fill="url(#watagIconGradient)" />
      <circle cx="32" cy="30" r="2.6" />
    </svg>
  );
}

// the rabbit's own sunglasses, doubles as the "meet the artists" icon
export function SunglassesIcon() {
  return (
    <svg {...base}>
      <rect x="5" y="18" width="15" height="12" rx="5" />
      <rect x="28" y="18" width="15" height="12" rx="5" />
      <path d="M20 22c1.5-2 6.5-2 8 0" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg {...base}>
      <rect x="6" y="9" width="36" height="32" rx="5" />
      <line x1="6" y1="18" x2="42" y2="18" />
      <line x1="15" y1="5" x2="15" y2="13" />
      <line x1="33" y1="5" x2="33" y2="13" />
      <circle cx="16" cy="27" r="2" fill="url(#watagIconGradient)" />
      <circle cx="24" cy="27" r="2" fill="url(#watagIconGradient)" />
      <circle cx="32" cy="27" r="2" fill="url(#watagIconGradient)" />
    </svg>
  );
}

export function ChatIcon() {
  return (
    <svg {...base}>
      <path d="M7 12h34v20H21l-7 7v-7h-7z" />
      <circle cx="16" cy="22" r="1.6" fill="url(#watagIconGradient)" />
      <circle cx="24" cy="22" r="1.6" fill="url(#watagIconGradient)" />
      <circle cx="32" cy="22" r="1.6" fill="url(#watagIconGradient)" />
    </svg>
  );
}

export function ShopBagIcon() {
  return (
    <svg {...base}>
      <path d="M11 17h26l-2 24H13z" />
      <path d="M17 17c0-6 3-10 7-10s7 4 7 10" />
    </svg>
  );
}

export function GiftIcon() {
  return (
    <svg {...base}>
      <rect x="7" y="18" width="34" height="22" rx="3" />
      <line x1="7" y1="26" x2="41" y2="26" />
      <line x1="24" y1="18" x2="24" y2="40" />
      <path d="M24 18c-7-9-15-3-9 2 4 3 9-2 9-2zM24 18c7-9 15-3 9 2-4 3-9-2-9-2z" />
    </svg>
  );
}

export function LoginBadgeIcon() {
  return (
    <svg {...base}>
      <path d="M24 6 8 13v11c0 11 7 16 16 19 9-3 16-8 16-19V13z" />
      <circle cx="24" cy="22" r="4" />
      <line x1="24" y1="26" x2="24" y2="32" />
    </svg>
  );
}

export function ProfileIcon() {
  return (
    <svg {...base}>
      <circle cx="24" cy="16" r="8" />
      <path d="M8 41c1-9 8-14 16-14s15 5 16 14" />
    </svg>
  );
}

export function ScanIcon() {
  return (
    <svg {...base}>
      <path d="M8 16V9a3 3 0 0 1 3-3h7" />
      <path d="M40 16V9a3 3 0 0 0-3-3h-7" />
      <path d="M8 32v7a3 3 0 0 0 3 3h7" />
      <path d="M40 32v7a3 3 0 0 1-3 3h-7" />
      <rect x="18" y="18" width="12" height="12" rx="2" />
    </svg>
  );
}

export function GalleryIcon() {
  return (
    <svg {...base}>
      <rect x="5" y="13" width="30" height="24" rx="3" />
      <rect x="13" y="7" width="30" height="24" rx="3" fill="var(--watag-bg)" />
      <circle cx="22" cy="15" r="2.4" />
      <path d="M14 27l6-6 5 5 4-4 8 8" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg {...base}>
      <circle cx="24" cy="24" r="17" />
      <path d="M24 14v10l7 5" />
    </svg>
  );
}

export function ChartIcon() {
  return (
    <svg {...base}>
      <line x1="9" y1="40" x2="39" y2="40" />
      <rect x="12" y="26" width="7" height="14" />
      <rect x="21" y="17" width="7" height="23" />
      <rect x="30" y="9" width="7" height="31" />
    </svg>
  );
}
