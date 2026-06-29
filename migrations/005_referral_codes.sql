-- WATAG — built by Sidedoor Digital
-- Intellectual property of Sidedoor Digital
--
-- Adds a shareable referral code per client, and a completed_at
-- timestamp on referrals so it's clear when a referral actually
-- converted into a real visit, not just a signup. Purely additive.
--
-- wrangler d1 execute watag-db --file=./migrations/005_referral_codes.sql --remote

ALTER TABLE clients ADD COLUMN referral_code TEXT;
ALTER TABLE referrals ADD COLUMN completed_at TEXT;

CREATE UNIQUE INDEX idx_clients_referral_code ON clients(referral_code) WHERE referral_code IS NOT NULL;
