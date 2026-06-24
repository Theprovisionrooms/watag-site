-- WATAG — built by Sidedoor Digital
-- Intellectual property of Sidedoor Digital
--
-- Swaps client identity from email to phone. Safe to run, the clients
-- table has no real signups in it yet, nothing built so far has ever
-- written a row to it.
--
-- wrangler d1 execute watag-db --file=./migrations/002_client_phone_login.sql --remote

DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS auth_tokens;

CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
