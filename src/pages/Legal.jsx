// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Public privacy / cookies / GDPR page, linked from the bottom of the
// home screen next to the artist login link, no sign-in required by
// design, this has to be visible to anyone before they hand over data.
// Content below is a real first draft based on what this app actually
// collects and stores (see schema.sql), not filler text. Get it checked
// by a solicitor before treating it as final.

import { NavBack } from "../App.jsx";

const SECTIONS = [
  {
    title: "What we collect",
    body: "Clients: name, email and phone number when a loyalty account is created. Enquiry messages, including any photos a client attaches. Waitlist requests and referral activity. Order details when someone buys from the shop. Staff: name, email, PIN, bio, portfolio photos and availability. If someone turns on notifications, we store a push subscription token, no personal detail beyond that.",
  },
  {
    title: "Why we collect it",
    body: "To run the loyalty card, respond to enquiries, manage bookings and the waitlist, fulfil shop orders, and send the notifications someone specifically opted into (stamp added, reward ready, new message, referral bonus). We don't collect anything beyond what each of those features needs.",
  },
  {
    title: "Cookies & local storage",
    body: "This app doesn't use tracking or advertising cookies. It stores a small amount of data in the browser's local storage on the device itself, a session token so a client isn't asked to re-verify by email every visit, and a staff login token. Clearing site data or using a different device or browser will sign someone out and nothing more.",
  },
  {
    title: "Who else sees it",
    body: "Stripe processes shop payments, we don't see or store card details. Cloudflare hosts the app, the database, and any uploaded photos. Neither is used for marketing and neither gets more data than the specific job needs.",
  },
  {
    title: "How long we keep it",
    body: "Loyalty and enquiry data is kept while an account is active. Verification codes and QR scan tokens expire within minutes and are single use. A client can ask for their account and history to be deleted at any time, see below.",
  },
  {
    title: "Your rights (UK GDPR)",
    body: "Every client can ask to see what's held on them, correct anything wrong, or have their account deleted entirely. Send requests to [studio email] and we'll deal with it within one month.",
  },
  {
    title: "Data controller",
    body: "WATAG is the data controller for everything collected through this app. [Add registered business name and address here for the published version.]",
  },
];

export default function Legal() {
  return (
    <div className="watag-screen">
      <NavBack />
      <h1>Privacy & cookies</h1>
      <p style={{ color: "var(--watag-text-dim)" }}>
        How this app handles your data, what's stored, and what your rights are.
      </p>

      {SECTIONS.map((section) => (
        <div key={section.title} className="watag-card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong>{section.title}</strong>
          <p style={{ margin: 0, color: "var(--watag-text-dim)", fontSize: 14 }}>{section.body}</p>
        </div>
      ))}
    </div>
  );
}

