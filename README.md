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

- Live sign-off from Jay on the merch list that's loyalty-eligible at the 6 stamp tier, the checkbox exists in the staff product form now, just needs him deciding which items it applies to.
- `RESEND_API_KEY` needs setting as a secret before the email code or order confirmation emails can actually send, set against the Pages project: `wrangler pages secret put RESEND_API_KEY --project-name=YOUR-PROJECT-NAME`.
- `request-code.js` and `webhook.js` both currently send from Resend's test domain, swap for a real verified domain once one's set up in the Resend dashboard.
- Enquiry threads are text only for v1. The schema's got a `gallery_ref_id` column ready for letting a client attach one of the artist's existing gallery photos as a reference, just needs the picker UI on top when there's time, low priority for now.
- Shop assumes pickup in studio, not delivery. Easy to add shipping later, the schema doesn't change either way, just flagging it was an assumption, not a confirmed decision from Jay.
- **Migration 004 assumes staff id 1 is Jay** and marks that row as `owner`. Check it landed on the right person once it's live, if not just re-run `UPDATE staff SET role = 'owner' WHERE id = X` with the correct id, no harm done either way.
- `GOOGLE_REVIEW_URL` in `functions/api/reviews/request.js` and `functions/api/reviews/click.js` is a placeholder, swap both for Jay's real Google Business Profile review link.

## install banner

A custom banner now floats at the bottom of the screen offering the install, since Chrome stopped showing its own install popup automatically a while back, this has to be triggered by hand from the `beforeinstallprompt` event. iOS has no such event at all, Safari never lets a site trigger its own install, so on iPhone the banner just shows plain instructions (share button, then "Add to Home Screen") instead of a button.

Dismissing it hides it for 14 days, then it resurfaces. Once someone's actually installed it, it never shows again, detected via `display-mode: standalone`.

## icons

Square 192px and 512px PWA icons now exist at `public/icons/icon-192.png` and `icon-512.png`, generated from the rabbit logo with enough padding to survive Android's circular masking. If Chrome wasn't offering an install prompt before, this was almost certainly why, a manifest pointing at icon files that don't exist fails the install check silently. Safari never shows an automatic prompt regardless, on any site, that's an Apple platform rule, "Add to Home Screen" via the Share menu is the only path there and always was.

## review nudges

Artists send a review request straight from the scan screen, right after stamping a loyalty card, that's the moment someone's happiest with a fresh tattoo. The email link routes through `/api/reviews/click` first so a click gets recorded in `review_nudges` before redirecting on to the real Google review page.

## navigation icons

Home and the staff hub are now icon grids rather than lists of text links, this is the actual "feels like an app" bit Jay asked for at the very start. Each icon's custom (`src/components/icons.jsx`), built to match what it actually leads to, not generic clip art, and they all share one gradient stroke (defined once, globally, in `App.jsx`) so they read as a single family rather than mismatched pieces. The "meet the artists" icon is literally the rabbit's own sunglasses shape, since that's the one visual everyone already associates with WATAG.

The rabbit gets a proper hero spot at the top of both home screens now too, with a slow ambient glow rather than constant motion, `prefers-reduced-motion` turns it off entirely.

Only the two main hub screens have this treatment so far. The same icon language can extend to smaller in-page links (the artist directory's "view gallery" / "message" links, for instance) if that's wanted next, kept this round to where it matters most.

## artists, ownership, and roles

"Staff" is now "Artists" everywhere a client or artist actually sees text. The code underneath still says `staff` throughout (tables, routes, function names), renaming all of that for a label change wasn't worth the risk, what matters is what shows on screen, not the folder structure.

Each artist edits their own name, bio, and photo at `/staff/profile`, that's the one place all of it lives now, the colour picker moved there too from the old availability page.

Two roles exist on the `staff` table: `owner` and `artist`. Jay's the only `owner`. That role gates the shop management page and its underlying endpoints, both in the UI (an artist won't even see the "Manage shop" link) and on the server (the endpoint checks the role itself, doesn't just trust the frontend to hide the button). Worth knowing honestly: the product endpoints had **no permission check at all** before this, anyone with the right URL could've added or removed stock. That's closed now, not a new gap, an existing one finally locked down.

Client facing artist directory lives at `/artists`, pulls photo/bio/gallery straight from what each artist's set on their own profile and gallery pages, nothing for Jay to keep in sync separately. Each artist card has a "message" button straight into a thread with them.

## security note

Client sign-in is now a one-time email code per device, not a typed-in phone number. First visit on a phone needs the code, every visit after that is instant, the session token just sits on the device and gets reused silently. Phone number's still collected and shown on the profile, it's just not the thing that proves who someone is anymore, email is.

Card and QR endpoints now resolve the signed-in client from that session token server side, rather than trusting an id sent up from the browser. Closes the gap where anyone could've typed in a different account's id and seen someone else's stamp count.

## shop setup

Two new Stripe secrets needed, set both against the Pages project:

```
wrangler pages secret put STRIPE_SECRET_KEY --project-name=YOUR-PROJECT-NAME
```

```
wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name=YOUR-PROJECT-NAME
```

The webhook secret comes from registering an endpoint in the Stripe dashboard (Developers → Webhooks → Add endpoint) pointing at `https://yourdomain/api/shop/webhook`, listening for `checkout.session.completed`. That endpoint is the real source of truth for a payment going through, not the success page redirect, someone can land on `/shop/success` without ever having actually paid, only the webhook marks an order `paid` in the database.

## referrals

Each client gets a personal 6-character code and a shareable link (`/r/CODE`), generated the first time they visit `/referrals`. A signup through that link doesn't earn anything on its own, that's free and means nothing, the referral only completes once the new person actually comes in and gets their first stamp, at which point the referrer gets a bonus stamp on their own card automatically. The leaderboard at `/referrals` only counts completed referrals, same reasoning.

The completion check lives inside `scan.js`, the same endpoint that already applies every stamp, it checks whether this is someone's genuine first ever stamp (not just a card that's reset to 0 after a 9-stamp reward), and if there's a pending referral sitting against them.

## next steps

Loyalty loop, staff gallery, colour coded rota, verified client accounts, enquiry threads, the shop, owner/artist roles, the client facing artist directory, the waitlist, review nudges, the owner-only stats dashboard, and referrals are all built and wired together. That's everything from the original brief plus every smaller addition agreed along the way, aftercare guide aside, which was deliberately dropped.

Nothing left on the list. Next features come from whatever Jay actually asks for once people are using it for real.

## one open gap, not new

There's no "mark this reward as actually handed over" action anywhere in the app yet. The stats dashboard reports stamps issued and rewards currently sitting pending, not a historical redemption count, `loyalty_redemptions` exists in the schema but nothing writes to it. Worth building if Jay wants to see redemption history properly, just hasn't come up yet.

---
Intellectual property of Sidedoor Digital.
