-- WATAG — built by Sidedoor Digital
-- Intellectual property of Sidedoor Digital
--
-- Adds a real approval workflow to the waitlist. Entries start
-- pending, the artist requested (or any artist, if none specific was
-- picked) approves or declines. Purely additive.
--
-- wrangler d1 execute watag-db --file=./migrations/008_waitlist_approval.sql --remote

ALTER TABLE waitlist ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
