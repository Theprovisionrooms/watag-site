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
| Enquiries | `/messages`, `/staff/messages` | Polling based chat threads, text or photo, either side can delete a message, artist can moderate any message in their thread |
| Shop | `/shop`, `/staff/products` | Stripe checkout, owner-only product management, pickup in studio |
| Waitlist | `/waitlist`, `/staff/waitlist` | Client requests a date that's not free, artists see who's waiting |
| Review nudges | scan screen → email | Sent right after a stamp, click-tracked link through to the Google review |
| Referrals | `/referrals` | Personal code + link, completes on the referred person's first stamp, bonus stamp for the referrer, leaderboard |
| Stats dashboard | `/staff/stats` | Owner only, revenue, top sellers, client growth, loyalty volume, enquiry volume, review click rate |
| Push notifications | bell tile, both home screens | Stamp/reward, referral bonus, new enquiry message, waitlist match, hand-rolled Web Push (no Node dependency) |
| Waitlist | `/waitlist`, `/staff/waitlist` | Real approve/decline workflow, locked to the specific artist requested if one was picked, push notification either way |
| Aftercare guide | `/aftercare` | Generic, standard tattoo aftercare information |
| Visual system | site-wide | Looping background video, physical loyalty card with grain texture, transparent rabbit hero with intro glitch and idle float, staggered tile entrance, enlarged icon tap targets |
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

Migrations already run, in order, against the live database: `002`, `003`, `004`, `005`, `006`, `007`, `008`, all in `migrations/`. If recreating from scratch, `schema.sql` already matches the end state, the migrations folder is history, not something to re-run.

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

- **All 3 seeded artist accounts are still on PIN `1234`** in `seed.sql`. The change-PIN feature exists at `/staff/profile`, each artist needs to actually use it if they haven't already.
- Migration 004 assumed staff id 1 was Jay and marked that row `owner`. Worth confirming it landed on the right person, easy one-line fix if not: `UPDATE staff SET role = 'owner' WHERE id = X`.
- Jay hasn't confirmed which merch items count toward the 9-stamp loyalty reward, the checkbox exists in the product form, just needs his call.
- No "mark this reward as actually handed over" action exists anywhere. The stats dashboard shows stamps issued and rewards currently pending, not a redemption history, `loyalty_redemptions` sits unused in the schema. Worth building if Jay wants that history properly tracked.
- Enquiry threads are text only, the schema's ready for letting a client attach one of the artist's own gallery photos as a reference (`gallery_ref_id`), just no picker UI built yet, low priority.
- The icon-grid treatment only covers the two main home screens so far (client and artist). Same icon language could extend to smaller in-page links if wanted.

## fonts

Headings use **Setback TT BRK**, by Ænigma Fonts, a bitmap/stencil display face, free for commercial use. `Setback.ttf` and a converted `Setback.woff2` both live at `public/fonts/`, `@font-face` in `global.css` loads the woff2 first with the ttf as fallback. Nothing left to do here.

## domain and email

Live at **watagapp.co.uk**, connected through Cloudflare Pages. DKIM and SPF are set up for Resend against that domain, so login codes, order confirmations, and review nudges all send from a real, authenticated `studio@watagapp.co.uk` rather than Resend's test domain.

## push notifications, live

VAPID keys are generated and set, `VITE_VAPID_PUBLIC_KEY`/`VAPID_PUBLIC_KEY` in `wrangler.toml`, `VAPID_PRIVATE_KEY` as a Pages secret. Push works end to end, stamp/reward, referral bonus, new enquiry message, waitlist match.

## galleries, this session

Both the studio gallery (`/studio`) and each artist's public gallery (`/artists/:id/gallery`) moved from a static grid to a swipeable carousel, `src/components/GalleryCarousel.jsx`. Native CSS scroll-snap rather than a drag library, that's what makes the swipe feel free on a phone without adding a dependency. One photo full width per slide with a peek of the next one's edge so it reads as swipeable at a glance, dot pagination below tracks position via `IntersectionObserver`, small arrow buttons for anyone on a trackpad or mouse. Everything respects `prefers-reduced-motion`. The artist's own gallery management screen at `/staff/gallery` stays a plain grid on purpose, that's an upload/delete tool, not a browsing experience, a carousel would only get in the way there.

## wordmark

The "WATAG" text heading on the home screen is now the client's own logo artwork (`public/icons/wordmark.png`) rather than typed text, with a slow ambient flicker (hue-rotate and a slight shift, not a hard glitch) so it reads as alive rather than static, the single biggest brand moment on the page.

## ambient icon instability

Every nav icon (not just the ones with a glow) now carries a second, irregular animation layered on top of the existing smooth pulse, short opacity dips and tiny skews at uneven, non-repeating-feeling intervals. Deliberately built at a duration that doesn't divide evenly into the existing pulse, so the two never fall back into sync, that's what reads as "slightly unstable" rather than a clean breathing loop. No interaction needed, this runs constantly, same as the request. Turns off completely under `prefers-reduced-motion`, same as everything else animated in the app.

## message photos

Clients and artists can now send a photo inside an enquiry thread, not just text, via the camera icon next to the message box.

**Cost is handled client side, before a single byte reaches the server.** A phone camera photo is routinely 3-8MB. `src/utils/resizeImage.js` resizes it to a maximum 1440px edge and re-compresses to JPEG at 75% quality entirely in the browser, before upload, typically bringing it down to a few hundred KB with no visible quality loss on a phone screen. That's the real lever on storage and bandwidth cost, not something to solve after the fact.

**Deletion is the other half of cost control.** Either the person who sent a message, or the artist in that thread (regardless of who sent it, this doubles as light moderation), can delete any message. Deleting one with a photo attached removes the R2 object immediately, not just the database row, so storage never just accumulates with no way to claw it back. No separate cleanup job needed.

New endpoint: `functions/api/enquiries/upload-photo.js`, stores under `enquiries/<threadId>/`, returns a key referenced when the message itself gets created through the existing `/api/enquiries/messages` endpoint. `authoriseThread` (the ownership check) got pulled out into `functions/_lib/enquiries.js` since both endpoints need it now, rather than staying duplicated inside `messages.js`.

## loyalty card, this session

- **Merch and session credit swapped.** Merch is now the 9 stamp tier, the top prize, session credit dropped to 6. Every place that referenced the old order (the scan endpoint, the card status endpoint, the product form's "eligible for the loyalty reward" checkbox) is updated to match. `TIER_REWARDS` in `functions/api/loyalty/scan.js` is the one place that actually controls this, if it ever needs changing again, that's the source of truth.
- **The card now actually looks like a card.** Real proportions (credit-card ratio), a dark gradient body, a slow holographic sheen sweeping across it. Each of the 9 stamps uses the client's own logo mark (`public/icons/stamp-mark.png`) rather than a plain dot, dim and greyscale until earned, full colour with a glow once it lands. The 3/6/9 tier positions get an amber ring so they read as the prize points they are.
- **QR scanning stayed a separate panel below the card**, on purpose, a real physical card doesn't have a QR code on its face, so the card shows the stamps (the object itself) and the panel underneath is the scan terminal (the mechanism), keeps each part doing one job.
- **The "WATAG · Southport" eyebrow tag above the wordmark is gone.** The logo already carries the branding, it was redundant.

## messaging, this session

An artist opening a client's enquiry thread now sees the client's phone number too, not just their name, both in the inbox list and at the top of the conversation itself. Comes straight off the `clients` table, no new field needed, `threads.js` just wasn't selecting it before. Clients still only ever see the artist's name, not a phone number, that side's unchanged.

## home screen polish, this session

- **Rabbit hero is transparent now** (`public/icons/rabbit-hero.png`), no dark box around it, cropped tight and sized up (148px on the client home, smaller on the staff hub). The app icon files (`icon-192.png`/`icon-512.png`) keep their solid background deliberately, that's needed for the PWA install/manifest, only the on-page hero display changed.
- **Intro glitch on load.** The rabbit fires the same RGB-split glitch already used on a successful stamp, once, on page mount, not looping. Nav tiles also get a light staggered fade-and-rise as they load in. Both respect `prefers-reduced-motion`.
- **"Message an artist" removed from the client home grid.** Messaging isn't gone, every artist's own card on `/artists` has a message button, that's the flow now, message a specific person rather than "a" generic artist. The inbox list at `/messages` still exists and stays reachable via the back arrow inside any open conversation.
- **Artist login demoted from a nav tile to a small quiet text link** at the bottom of the home screen, on purpose, a home-screen icon next to loyalty cards and the shop was inviting customers to poke at a login that isn't for them. Still one tap away, just not presented as a feature.
- **Synthwave grid widened.** The horizontal lines were shrinking too fast near the horizon, leaving a bare triangle of dead space either side of the grid at the top of the floor. Widened the perspective curve so the grid reaches close to both edges throughout, not just at the very bottom.

## text cleanup, this session

Removed the small amber "eyebrow" label from every screen where it was just restating the page's own heading or icon, since the app's icon-driven now and doesn't need a text label repeating what's already obvious (calendar, artists directory, shop, referrals, waitlist, staff hub, and so on). Kept the ones that carry real information nothing else on screen conveys: "Check your email" during the login code step, and "Owner only" on the stats dashboard. Also removed the big "{name}'s card" heading from the loyalty card screen, the physical card visual itself already shows the name and stamp count directly on its face, having it twice was redundant. And dropped the "Loyalty card, gallery, bookings and shop, all in one place" line from the home screen, the icon grid speaks for itself now.

## loyalty card background

Went with an original moody radial-glow-plus-grain treatment first, avoiding the stock wallpaper reference image since that one wasn't something WATAG had rights to use commercially. Since settled on the client's own branded scene artwork instead (`public/backgrounds/scene.webp`, the same file originally tried as the full app background), scaled to fit inside the card rather than cropped (`background-size: contain`), sat over a dark gradient fill so any letterboxed space still looks intentional, with a subtle dark tint over the top so the stamps and card text stay legible against a busier image than a flat gradient. Same holographic sheen animation as before still sweeps across the top of it.

## animated app background

Went through two other approaches first (the client's branded scene artwork as a static backdrop, then a canvas-drawn moving grid) before landing here: a looping background video (`public/backgrounds/loop.mp4`), fixed behind every screen, muted and autoplaying continuously. Re-encoded down from the original 3.7MB to about 2MB, no audio track (not needed for a background element), `faststart` so it can begin playing before the whole file's downloaded. Went through a couple of compression passes to get here, the first attempt was compressed too hard and looked visibly soft on a phone screen, this one keeps native resolution with much lighter compression.

**Autoplay specifics worth knowing:** `muted` and `playsInline` are both required for this to autoplay on mobile Safari and Chrome, no exceptions, browsers block autoplay with sound entirely regardless of any other setting, that's not something to work around, it's a hard platform rule. Under `prefers-reduced-motion`, the video is explicitly paused via JS rather than just visually hidden, so a device with motion turned down isn't left silently decoding video in the background for no visible reason.

**iOS's own "tap to play" button**, the thing that made the background look unfinished on first load, is a distinct WebKit overlay that shows on any video it declines to autoplay, separate from the `controls` attribute entirely. Hidden explicitly via `::-webkit-media-controls-start-playback-button` and related pseudo-elements in `global.css`. On top of that, `SynthwaveBackground.jsx` calls `.play()` directly on mount and retries once on the very first tap anywhere on the page as a fallback, since a real user gesture always unlocks playback if the browser blocked it initially.

`public/backgrounds/scene.webp` (the branded artwork from the second background attempt) ended up finding a home after all, it's now the loyalty card's own background, see "loyalty card background" below.

## a little more flair, this session

The hero rabbit now drifts gently around its own space (a slow float and slight rotation, layered on top of its existing glow, they're different CSS properties so they don't fight each other) rather than sitting perfectly still. Every nav tile got the same idea applied more subtly, floating up and down a couple of pixels, layered on the tile itself rather than the icon inside it, since the icon already has its own pulse and flicker running and stacking a third transform-based animation directly on it would have just fought with those instead of combining. Both turn off entirely under `prefers-reduced-motion`.

## waitlist approval, this session

Waitlist entries now go through a real pending → approved/declined flow rather than just sitting there until someone deletes them. If a client asked for a specific artist, only that artist can approve or decline it, the server enforces this, not just the UI. If they were happy with "any artist", whoever gets there first can action it, and that locks the entry to them afterwards so it's clear who actually picked it up. Either outcome sends the client a push notification. Clients can see the status of their own requests at `/waitlist` underneath the join form.

## aftercare guide, this session

Back on the plan after being dropped earlier. `/aftercare`, generic standard tattoo aftercare guidance written fresh for this app rather than lifted from any specific source, first 24 hours, the first two weeks, signs to get checked out, and longer term care. Deliberately generic, "just a normal one" per the brief, not tailored per artist or per piece, the copy itself says an artist's own instructions for a specific tattoo always come first.

## brand

Rabbit-in-sunglasses as the focal mark, used a lot on purpose: app icon, splash, hero spot on both home screens, and the "meet the artists" nav icon is literally its sunglasses shape. Cyberpunk/vapor aesthetic throughout: deep black/navy background, hot pink and cyan as primary accents, amber for tags and labels, animated synthwave grid behind every screen. Motion is deliberate, not constant, ambient glow on icons and the rabbit, a glitch flash on stamp/reward moments, the grid scroll on the background, all of it turns off under `prefers-reduced-motion`. No em dashes, no emojis, no generic agency language anywhere in copy.

---
Intellectual property of Sidedoor Digital.
