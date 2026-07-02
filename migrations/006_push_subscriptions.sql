-- WATAG — built by Sidedoor Digital
-- Intellectual property of Sidedoor Digital
--
-- Stores one row per subscribed device. owner_type/owner_id mirrors
-- the same pattern used for enquiry threads, works for a client or
-- an artist without needing two separate tables. Purely additive.
--
-- wrangler d1 execute watag-db --file=./migrations/006_push_subscriptions.sql --remote

CREATE TABLE push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_type TEXT NOT NULL,      -- 'client' | 'staff'
  owner_id INTEGER NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_push_subscriptions_owner ON push_subscriptions(owner_type, owner_id);
