-- WATAG — built by Sidedoor Digital
-- Intellectual property of Sidedoor Digital
--
-- Moves client verification to email (the only channel that's free to
-- verify without a paid SMS provider). Phone stays on the profile as a
-- contact field, just no longer the security key.
--
-- Clears out test data in tables that reference clients first, since
-- foreign keys won't let the clients table drop while rows elsewhere
-- still point at it. Fine pre-launch, not fine once there's real
-- customer data in here.
--
-- wrangler d1 execute watag-db --file=./migrations/003_email_verification.sql --remote

DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM enquiry_messages;
DELETE FROM enquiry_threads;
DELETE FROM loyalty_stamp_log;
DELETE FROM loyalty_redemptions;
DELETE FROM qr_tokens;
DELETE FROM loyalty_cards;
DELETE FROM referrals;
DELETE FROM waitlist;
DELETE FROM review_nudges;

DROP TABLE IF EXISTS clients;

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