-- WATAG — built by Sidedoor Digital
-- Intellectual property of Sidedoor Digital
--
-- Seed data, 3 staff placeholders with default PIN "1234".
-- Rename and reset PINs through the staff settings screen before launch.
-- wrangler d1 execute watag-db --file=./seed.sql

INSERT INTO staff (name, email, pin_hash, calendar_color) VALUES
  ('Staff One', 'staff1@watag.co.uk', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '#E91E8C'),
  ('Staff Two', 'staff2@watag.co.uk', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '#00E5FF'),
  ('Staff Three', 'staff3@watag.co.uk', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '#F2B033');
