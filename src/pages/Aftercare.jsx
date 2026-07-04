// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Standard tattoo aftercare guidance, written fresh for WATAG rather
// than copied from any external source. Generic on purpose, "just a
// normal one" per the brief, not tailored per artist or piece. If an
// artist gives different instructions for a specific tattoo, always
// follow theirs over this, they know that piece and your skin.

import { NavBack } from "../App.jsx";

const SECTIONS = [
  {
    title: "First 24 hours",
    points: [
      "Leave the original dressing on for as long as your artist told you to, usually a few hours.",
      "Once it's off, wash gently with clean hands and a fragrance-free soap, lukewarm water, no scrubbing.",
      "Pat dry with a clean towel, don't rub.",
    ],
  },
  {
    title: "The first two weeks",
    points: [
      "Wash it twice a day, morning and night, same gentle method as above.",
      "Apply a thin layer of the aftercare product your artist recommended, a little goes a long way, too much can slow healing.",
      "Keep it out of direct sun, pools, baths, and the sea, submerging a fresh tattoo raises infection risk.",
      "Wear loose clothing over it where you can, friction and sweat both irritate healing skin.",
      "Expect some scabbing and itching, that's normal, don't pick or scratch it.",
    ],
  },
  {
    title: "Signs to get it checked",
    points: [
      "Spreading redness, heat, or swelling beyond the tattoo itself.",
      "Pus, a bad smell, or a fever.",
      "Pain that's getting worse rather than easing off.",
      "If in doubt, speak to a pharmacist or your GP, and let your artist know too.",
    ],
  },
  {
    title: "Longer term",
    points: [
      "Once fully healed (usually 2-4 weeks, deeper colour work can take longer), keep it moisturised day to day.",
      "Sun fades and damages tattoos more than almost anything else, SPF over it whenever it's exposed, for good.",
    ],
  },
];

export default function Aftercare() {
  return (
    <div className="watag-screen">
      <NavBack />
      <h1>Aftercare</h1>
      <p style={{ color: "var(--watag-text-dim)" }}>
        General guidance for looking after a new tattoo. Your artist's own instructions for your specific piece always come first.
      </p>

      {SECTIONS.map((section) => (
        <div key={section.title} className="watag-card">
          <strong style={{ display: "block", marginBottom: 10 }}>{section.title}</strong>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            {section.points.map((point, i) => (
              <li key={i} style={{ fontSize: 14, color: "var(--watag-text-dim)" }}>
                {point}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
