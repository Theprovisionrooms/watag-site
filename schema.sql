-- WATAG — built by Sidedoor Digital
-- Intellectual property of Sidedoor Digital
--
-- D1 schema. Run with:
-- wrangler d1 execute watag-db --file=./schema.sql

-- ===================== STAFF =====================

CREATE TABLE staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pin_hash TEXT,                      -- staff login, simple PIN/password hash for v1
  calendar_color TEXT DEFAULT '#E91E8C',  -- chosen by the staff member themselves
  role TEXT NOT NULL DEFAULT 'artist',    -- 'owner' | 'artist', owner gets the shop/money pages
  bio TEXT,
  photo_url TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE staff_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  date TEXT NOT NULL,                 -- YYYY-MM-DD
  start_time TEXT NOT NULL,           -- HH:MM
  end_time TEXT NOT NULL,             -- HH:MM
  status TEXT DEFAULT 'available',    -- available | booked | off
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_availability_staff_date ON staff_availability(staff_id, date);

CREATE TABLE staff_gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE staff_social_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  platform TEXT NOT NULL,             -- instagram | tiktok | facebook etc
  url TEXT NOT NULL
);

-- ===================== CLIENTS =====================

CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE client_verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_verification_codes_email ON client_verification_codes(email);

CREATE TABLE client_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_client_sessions_token ON client_sessions(token);

-- ===================== LOYALTY =====================

CREATE TABLE loyalty_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER UNIQUE NOT NULL REFERENCES clients(id),
  stamp_count INTEGER DEFAULT 0,      -- resets to 0 after the 9-stamp reward is redeemed
  pending_reward TEXT,                -- 'small_tattoo' | 'merch' | 'session_credit' | NULL
  last_stamped_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE loyalty_stamp_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE loyalty_redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  tier INTEGER NOT NULL,              -- 3 | 6 | 9
  reward_description TEXT NOT NULL,
  redeemed_at TEXT DEFAULT (datetime('now'))
);

-- rotating QR tokens, single use, short expiry
CREATE TABLE qr_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_qr_tokens_token ON qr_tokens(token);

-- merch items eligible for the 6-stamp tier
CREATE TABLE loyalty_eligible_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  active INTEGER DEFAULT 1
);

-- ===================== SHOP =====================

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  image_url TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_name TEXT NOT NULL,         -- e.g. size, colour
  stock INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id),
  stripe_payment_id TEXT,
  total_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',      -- pending | paid | fulfilled | cancelled
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  variant_id INTEGER REFERENCES product_variants(id),
  quantity INTEGER DEFAULT 1,
  price_cents INTEGER NOT NULL
);

-- ===================== ENQUIRIES =====================

CREATE TABLE enquiry_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  last_message_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(client_id, staff_id)
);

CREATE TABLE enquiry_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL REFERENCES enquiry_threads(id),
  sender_type TEXT NOT NULL,          -- 'client' | 'staff'
  sender_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  gallery_ref_id INTEGER REFERENCES staff_gallery(id),  -- optional reference photo from artist's portfolio
  read_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_enquiry_messages_thread ON enquiry_messages(thread_id, created_at);

-- ===================== EXTRAS (v1.5, schema ready now) =====================

CREATE TABLE referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_client_id INTEGER NOT NULL REFERENCES clients(id),
  referred_client_id INTEGER REFERENCES clients(id),
  status TEXT DEFAULT 'pending',      -- pending | completed
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  staff_id INTEGER REFERENCES staff(id),
  requested_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE review_nudges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  sent_at TEXT DEFAULT (datetime('now')),
  clicked_at TEXT
);
