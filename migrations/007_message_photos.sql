-- WATAG — built by Sidedoor Digital
-- Intellectual property of Sidedoor Digital
--
-- Adds photo_url to enquiry_messages for client/artist uploaded photos
-- sent directly in a conversation, separate from gallery_ref_id (which
-- points at an existing shot from the artist's own portfolio, still
-- available as an option, this is for a fresh photo instead).
--
-- wrangler d1 execute watag-db --file=./migrations/007_message_photos.sql --remote

ALTER TABLE enquiry_messages ADD COLUMN photo_url TEXT;
