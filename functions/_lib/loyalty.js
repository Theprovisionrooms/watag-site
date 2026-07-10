// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Shared between scan.js and redeem.js so the tier map only lives in
// one place. TOP_TIER is the stamp count that resets the card back to
// 0 once its reward is redeemed, everything below just clears the
// pending reward and keeps counting.

export const TIER_REWARDS = {
  3: "small_tattoo",
  6: "watag_hoodie",
  9: "in_store_credit",
};

export const TOP_TIER = 9;

export function tierForReward(reward) {
  const entry = Object.entries(TIER_REWARDS).find(([, r]) => r === reward);
  return entry ? Number(entry[0]) : null;
}
