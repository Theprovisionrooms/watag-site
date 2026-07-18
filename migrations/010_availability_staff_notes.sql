-- WATAG — built by Sidedoor Digital
-- Intellectual property of Sidedoor Digital
--
-- staff_availability already had a `notes` column but nothing in the
-- UI used it. We're now wiring it up as a client-facing note (e.g.
-- "guest artist in today") on the public rota, and adding a second
-- column for artist-only notes that never get sent to the public
-- calendar endpoint.

ALTER TABLE staff_availability ADD COLUMN staff_notes TEXT;
