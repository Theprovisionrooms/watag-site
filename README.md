<!--
  WATAG — built by Sidedoor Digital
  Intellectual property of Sidedoor Digital
-->

# WATAG

Multipage PWA for WATAG tattoo studio, Southport. Built and maintained by Sidedoor Digital.

GitHub is the source of truth. Cloudflare Pages deploys from this repo only. No manual uploads.

## what this is

Not a website with an app bolted on. The loyalty system is the headline feature and everything else (staff hub, calendar, shop, enquiries) hangs off the same client account so Jay can bring all his clients into one place over time.

Built as an installable PWA rather than a native app for v1. Gets a home screen icon, opens full screen, works offline for cached pages, can push notifications. No app store account or review process needed. Native wrapper (Capacitor/TWA) is a viable phase 2 if the app store presence becomes worth it once there's a real user base.

## locked decisions

**loyalty card**
- Stamp tiers: 3 stamps = small tattoo, 6 stamps = item of merch (client picks from a loyalty-eligible list, not one fixed item), 9 stamps = 3 hour session credit applied at next booking.
- Card resets to 0 after the 9 stamp reward is redeemed.
- Stamping is QR based. Client's account screen shows a QR code. Staff scan it through an in-app camera view (browser camera access, no native API needed).
- QR encodes a short lived rotating token (60 second expiry, single use) rather than a static client ID, so a screenshot can't be reused to fake a stamp.
- Server side cooldown after each successful stamp to stop accidental double scans.

**staff hub**
- 3 staff members.
- Each staff member logs in and can: set their own calendar colour (RGB picker), set their own availability, scan loyalty QR codes, upload to their own gallery, manage their own enquiry thread.
- Studio → staff → (gallery, availability, enquiries) structure, so adding a 4th artist later is a new row, not new code.

**calendar / availability**
- Per staff colour coding, chosen by the staff member themselves on login/settings, not fixed by admin.
- Simple availability block table per staff member. No external calendar tool integration, built in house.

**enquiries / booking**
- Structured per-thread enquiry system, one thread per client/artist pair. Feels like a chat to the client (message lands within a couple of seconds, no full reload) but is delivered by polling rather than a true open socket for v1.
- Data model (threads + messages + read state) is identical to real chat, so upgrading to a live socket (Cloudflare Durable Objects) later is a delivery-layer swap, not a rewrite.
- Text only in v1. Clients can attach a reference photo by picking from the artist's existing gallery rather than uploading their own image into the thread.

**shop**
- Small to start. Same Stripe checkout pattern as Candymonium. Product/variant schema built so sizes and options later are new rows, not new tables.

**everything else on the brief** (referral leaderboard, review nudge, waitlist, aftercare guide, stats dashboard) sits on top of the client/staff records once they exist. No special architecture needed, flagged as v1.5 additions once the core loop is live.

## tech stack

Collapsed to one provider rather than running Vercel + Supabase + Cloudflare side by side, matching the pattern already proven on Candymonium and the SDD rebuild.

- **Frontend:** React (Vite)
- **Hosting:** Cloudflare Pages
- **Backend:** Cloudflare Pages Functions
- **Database:** D1
- **Payments:** Stripe
- **Email / magic link auth:** Resend
- **Domain / security:** Cloudflare

## repo structure

```
watag/
├── index.html
├── vite.config.js           PWA manifest generated from here
├── public/
│   └── icons/                app icons (rabbit logo, needs square exports)
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── ClientLoyaltyCard.jsx   the loyalty passport, QR + stamp progress
│   │   ├── StaffLogin.jsx
│   │   └── StaffScan.jsx           camera scanner, stamps the card
│   └── styles/
│       ├── tokens.css        brand colour variables
│       └── global.css        resets, glitch effect, shared layout classes
├── functions/
│   └── api/
│       ├── loyalty/
│       │   ├── qr-generate.js     rotating token for the client's QR
│       │   ├── scan.js            staff side, applies the stamp
│       │   └── card.js            client side, current stamp count
│       └── staff/
│           ├── availability.js
│           ├── settings.js        staff pick their own calendar colour
│           └── login.js           PIN login
├── schema.sql               D1 schema, full data model
├── seed.sql                  3 placeholder staff accounts, default pin 1234
├── wrangler.toml
├── package.json
└── LICENSE
```

## setup

```
npm install
```

```
wrangler d1 create watag-db
```

Copy the returned `database_id` into `wrangler.toml`.

```
wrangler d1 execute watag-db --file=./schema.sql
```

```
wrangler d1 execute watag-db --file=./seed.sql
```

```
npm run dev
```

```
wrangler pages dev
```

## brand

Rabbit-in-sunglasses logo as the focal mark. Cyberpunk/vapor aesthetic: deep black/navy background, hot pink and cyan as primary accents, amber for tags/labels, glitch effects on hover and on stamp/reward moments rather than constant looping (needs a `prefers-reduced-motion` fallback). Boot/glitch loader on first load using the rabbit, doubling as the PWA splash screen. No em dashes, no emojis, no generic agency language anywhere in copy.

## open items

- Square icon exports of the rabbit logo at 192px and 512px, drop them in `public/icons/` as `icon-192.png` and `icon-512.png`. Current asset is the source file, fine for in-app use but not pre-cropped for the home screen icon slot.
- Live sign-off from Jay on the merch list that's loyalty-eligible at the 6 stamp tier.

## next steps

Loyalty loop, staff gallery, colour coded rota, and real client profiles (name + phone, no password, profile not security) are all built and wired together. Clients now get a real account on first visit to `/card` instead of the old placeholder.

Next up: the enquiry thread screens, now unblocked since there's a real client id behind every visitor.

---
Intellectual property of Sidedoor Digital.
