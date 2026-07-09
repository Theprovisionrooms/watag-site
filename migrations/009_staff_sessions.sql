-- Staff session tokens, mirrors client_sessions. Login now issues a
-- real token instead of the frontend just trusting a staffId it was
-- handed once. Also adds PIN brute-force lockout: 6 characters wrong,
-- 15 minute lockout, resets on a correct login.

CREATE TABLE staff_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_staff_sessions_token ON staff_sessions(token);

ALTER TABLE staff ADD COLUMN failed_pin_attempts INTEGER DEFAULT 0;
ALTER TABLE staff ADD COLUMN locked_until TEXT;
