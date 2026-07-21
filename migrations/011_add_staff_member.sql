-- WATAG — built by Sidedoor Digital
-- Intellectual property of Sidedoor Digital
--
-- Adds a 4th staff member, blank profile, artist role. They fill in
-- their own name/bio/photo/colour via the staff profile screen after
-- first login. Default PIN is "1234" same as the original 3, reset it
-- through staff settings once logged in.
--
-- Login uses this staff id + the PIN, so grab the new id after running
-- this (SELECT id FROM staff WHERE email = 'staff4@watag.co.uk') and
-- give it to them along with the PIN.
--
-- wrangler d1 execute watag-db --file=./migrations/011_add_staff_member.sql --remote

INSERT INTO staff (name, email, pin_hash, calendar_color, role) VALUES
  ('New Artist', 'staff4@watag.co.uk', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '#9B5DE5', 'artist');
