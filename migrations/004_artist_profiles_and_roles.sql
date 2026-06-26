-- WATAG — built by Sidedoor Digital
-- Intellectual property of Sidedoor Digital
--
-- Adds the owner role, plus bio and photo so artists can build a real
-- profile clients see. Purely additive, no existing data is touched.
--
-- ASSUMPTION: staff id 1 is Jay. Check this against the real roster
-- before running, or just run the UPDATE again afterwards with the
-- correct id if it's wrong, no harm either way.
--
-- wrangler d1 execute watag-db --file=./migrations/004_artist_profiles_and_roles.sql --remote

ALTER TABLE staff ADD COLUMN role TEXT NOT NULL DEFAULT 'artist';
ALTER TABLE staff ADD COLUMN bio TEXT;
ALTER TABLE staff ADD COLUMN photo_url TEXT;

UPDATE staff SET role = 'owner' WHERE id = 1;
