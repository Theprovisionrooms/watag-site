<!--
  WATAG — built by Sidedoor Digital
  Intellectual property of Sidedoor Digital
-->

# WATAG

Multipage PWA for WATAG tattoo studio, Southport. Built and maintained by Sidedoor Digital.

GitHub is the source of truth. Cloudflare Pages deploys from this repo only. No manual uploads.

## what this is

Not a website with an app bolted on. The loyalty system is the headline feature, everything else hangs off the same client or artist account so Jay can run the whole studio through one place over time.

Installable PWA rather than a native app. Home screen icon, opens full screen, works offline for cached pages, can push notifications. No app store account or review process needed. Native wrapper (Capacitor/TWA) stays a viable phase 2 if that's ever worth it.

## status: everything's built

Every feature from the original brief is live, plus everything agreed along the way. Nothing queued up right now, next work comes from real usage once Jay and his artists are actually on it.

| Area | Where | What it does |
|---|---|---|
| Loyalty card | `/card` | QR stamping, 3/6/9 tier rewards, rotating codes so a screenshot can't be reused |
| Client accounts | `/card` (first visit) | Name, phone, email verified by a one-time code, then silent on that device after |
| Artist accounts | `/staff` | PIN login, two roles: `owner` (Jay) and `artist` |
| Artist profiles | `/staff/profile` | Each artist edits their own name, bio, photo, calendar colour, and PIN |
| Artist directory | `/artists` | Client facing, photo, bio, gallery link, message button per artist |
| Calendar | `/calendar`, `/staff/availability` | Colour coded per artist, artists set their own slots |
| Gallery | `/staff/gallery`, `/artists/:id/gallery` | Each artist uploads their own portfolio, public read-only view per artist |
| Enquiries | `/messages`, `/staff/messages` | Polling based chat threads, client ↔ artist, feels instant |
| Shop | `/shop`, `/staff/products` | Stripe checkout, owner-only product management, pickup in studio |
| Waitlist | `/waitlist`, `/staff/waitlist` | Client requests a date that's not free, artists see who's waiting |
| Review nudges | scan screen → email | Sent right after a stamp, click-tracked link through to the Google review |
| Referrals | `/referrals` | Personal code + link, completes on the referred person's first stamp, bonus stamp for the referrer, leaderboard |
| Stats dashboard | `/staff/stats` | Owner only, revenue, top sellers, client growth, loyalty volume, enquiry volume, review click rate |
| Push notifications | bell tile, both home screens | Stamp/reward, referral bonus, new enquiry message, waitlist match, hand-rolled Web Push (no Node dependency) |
| Visual system | site-wide | Animated canvas synthwave background, icon nav grid (enlarged, no card boxes), tap glitch, rabbit hero, brand gradient |
| Install | site-wide | Custom install banner (Android) / instructions (iOS), PWA icons, manifest |

Dropped from the plan on purpose: an aftercare guide page, decided not worth building.

## tech stack

One provider rather than several side by side, same pattern proven on Candymonium and the SDD rebuild.

- **Frontend:** React (Vite)
- **Hosting:** Cloudflare Pages
- **Backend:** Cloudflare Pages Functions
- **Database:** D1
- **Media storage:** R2
- **Payments:** Stripe
- **Email:** Resend
- **Domain / security:** Cloudflare

## repo structure

```
watag/
├── index.html
├── vite.config.js                  PWA manifest generated from here
├── public/icons/                   app icons
├── src/
│   ├── main.jsx
│   ├── App.jsx                      router, global icon gradient, synthwave mount
│   ├── components/
│   │   ├── icons.jsx                 the full nav icon set
│   │   ├── NavTile.jsx               icon grid tile
│   │   ├── SynthwaveBackground.jsx   animated background
│   │   ├── InstallPrompt.jsx         custom install banner
│   │   └── MessageThread.jsx         shared chat UI, client + staff
│   ├── pages/                        one file per screen, 20+ now, see App.jsx for the full route list
│   └── styles/
│       ├── tokens.css                 brand colour variables
│       └── global.css                 resets, animations, nav grid, synthwave CSS
├── functions/
│   ├── _lib/session.js               shared auth helpers (session, viewer, owner check, pin hashing)
│   ├── media/[[path]].js             serves R2 files through our own domain
│   └── api/
│       ├── clients/                  request-code, verify-code (signup + login)
│       ├── loyalty/                  card, qr-generate, scan (stamps, rewards, referral completion)
│       ├── staff/                    login, change-pin, profile, list, availability, gallery, products, stats
│       ├── enquiries/                 start, threads, messages
│       ├── shop/                      products, checkout, webhook
│       ├── referrals/                 code, leaderboard
│       ├── reviews/                   request, click
│       └── waitlist/
├── migrations/                       run in order against an existing database, see setup below
├── schema.sql                        full schema, matches a brand new database exactly
├── seed.sql                          3 placeholder artist accounts
├── wrangler.toml
├── package.json
└── LICENSE
```

## setup, brand new database

```
npm install
```

```
wrangler d1 create watag-db
```

Copy the returned `database_id` into `wrangler.toml`.

```
wrangler d1 execute watag-db --file=./schema.sql --remote
```

```
wrangler d1 execute watag-db --file=./seed.sql --remote
```

```
wrangler r2 bucket create watag-media
```

Secrets, set against the Pages project, not as Workers secrets:

```
wrangler pages secret put RESEND_API_KEY --project-name=YOUR-PROJECT-NAME
wrangler pages secret put STRIPE_SECRET_KEY --project-name=YOUR-PROJECT-NAME
wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name=YOUR-PROJECT-NAME
```

Stripe webhook secret comes from Stripe dashboard → Developers → Webhooks → Add endpoint, pointing at `https://yourdomain/api/shop/webhook`, listening for `checkout.session.completed`.

## setup, existing database (this one)

Migrations already run, in order, against the live database: `002`, `003`, `004`, `005`, `006`, all in `migrations/`. If recreating from scratch, `schema.sql` already matches the end state, the migrations folder is history, not something to re-run.

## push notifications

Real push, not just the install banner. Four triggers fire automatically:

- **a stamp lands** → the client's notified, a different message if it unlocked a reward
- **a referral completes** → the referrer's notified about their bonus stamp
- **a new enquiry message arrives** → whoever didn't send it is notified
- **an artist adds an available slot** → anyone on the waitlist for that date (with them specifically, or happy with anyone) gets notified automatically, no one has to remember to check the waitlist by hand

Either side turns it on from a bell tile on their home screen, browser permission prompt, done.

**Why this was hand-built:** the standard `web-push` npm package depends on Node's `crypto` module, which doesn't exist in the Cloudflare Pages Functions runtime. `functions/_lib/webpush.js` implements the same protocol (RFC 8291 payload encryption, RFC 8292 VAPID auth) directly against the Workers runtime's native `crypto.subtle`, same end result, no dependency.

**One-time setup:**

```
node scripts/generate-vapid-keys.js
```

```
wrangler pages secret put VAPID_PRIVATE_KEY --project-name=YOUR-PROJECT-NAME
```

The public key isn't a secret, it has to ship to the browser by design. Set it as a **build environment variable** in the Cloudflare Pages dashboard (Settings → Environment variables, not `wrangler pages secret`): `VITE_VAPID_PUBLIC_KEY`.

```
wrangler d1 execute watag-db --file=./migrations/006_push_subscriptions.sql --remote
```

**Service worker note:** the PWA strategy changed from `generateSW` to `injectManifest` (`vite.config.js`) to support custom `push`/`notificationclick` handlers, the default mode can't add those. Service worker source now lives at `src/sw.js`, not auto-generated. New build dependencies: `workbox-precaching`, `workbox-routing`, `workbox-strategies`, run `npm install` after pulling this.

## key design decisions worth knowing

- **QR tokens rotate every 60 seconds**, single use, so a screenshot of someone's loyalty card can't be reused to fake a stamp.
- **Client sign-in is a one-time email code, once per device.** First visit needs it, every visit after is instant. Phone number's collected and shown on the profile but isn't the security key, email is.
- **Session tokens, not raw client ids.** Card and QR endpoints resolve the signed-in client from a signed session token server side, never trust an id sent up from the browser.
- **Owner role gates money.** Shop management and the stats dashboard check `role = 'owner'` both in the UI and on the server. The shop endpoints had no permission check at all before this was added, worth knowing that was a real gap, now closed.
- **Referrals only complete on a genuine first visit**, not a signup. Signing up is free and proves nothing, getting a first stamp does. Bonus stamp for the referrer fires from inside `scan.js`, the same place every stamp gets applied.
- **Enquiries poll every few seconds rather than holding a socket open.** Feels instant on a phone, costs far less to run. The data model (threads, messages, read state) is identical to real chat, so swapping in a live connection later is a delivery layer change, not a rewrite.
- **"Staff" is "Artists" everywhere visible.** The code underneath still says `staff` throughout, tables, routes, function names, renaming all of that for a label change wasn't worth the risk.
- **Shop assumes pickup in studio**, not delivery. An assumption, not a confirmed decision from Jay, easy to add shipping later if needed.

## genuinely outstanding, needs Jay or a setup step, not more code

- Resend domain isn't verified yet. Until it is, no real email actually sends (login codes, order confirmations, review nudges), they're all on Resend's test domain right now. `request-code.js`, `webhook.js`, and `reviews/request.js` all need the sender address swapped once a domain's verified.
- `GOOGLE_REVIEW_URL` is a placeholder in two files (`reviews/request.js`, `reviews/click.js`), needs Jay's real Google Business Profile review link.
- **All 3 seeded artist accounts are still on PIN `1234`.** The change-PIN feature exists at `/staff/profile`, each artist needs to actually use it.
- Migration 004 assumed staff id 1 was Jay and marked that row `owner`. Worth confirming it landed on the right person, easy one-line fix if not: `UPDATE staff SET role = 'owner' WHERE id = X`.
- Jay hasn't confirmed which merch items count toward the 6-stamp loyalty reward, the checkbox exists in the product form, just needs his call.
- No "mark this reward as actually handed over" action exists anywhere. The stats dashboard shows stamps issued and rewards currently pending, not a redemption history, `loyalty_redemptions` sits unused in the schema. Worth building if Jay wants that history properly tracked.
- Enquiry threads are text only, the schema's ready for letting a client attach one of the artist's own gallery photos as a reference (`gallery_ref_id`), just no picker UI built yet, low priority.
- The icon-grid treatment only covers the two main home screens so far (client and artist). Same icon language could extend to smaller in-page links if wanted.
- **VAPID keys need generating for the live deployment**, the setup section above has the exact steps. Without them, push notifications silently do nothing, the toggle UI works but nothing actually sends.

## brand

Rabbit-in-sunglasses as the focal mark, used a lot on purpose: app icon, splash, hero spot on both home screens, and the "meet the artists" nav icon is literally its sunglasses shape. Cyberpunk/vapor aesthetic throughout: deep black/navy background, hot pink and cyan as primary accents, amber for tags and labels, animated synthwave grid behind every screen. Motion is deliberate, not constant, ambient glow on icons and the rabbit, a glitch flash on stamp/reward moments, the grid scroll on the background, all of it turns off under `prefers-reduced-motion`. No em dashes, no emojis, no generic agency language anywhere in copy.

---
Intellectual property of Sidedoor Digital.
