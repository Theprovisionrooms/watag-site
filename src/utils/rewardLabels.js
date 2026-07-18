// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Single source of truth for turning a reward key (as stored on
// loyalty_cards.pending_reward) into the text a human reads. Keys
// stay stable in the DB even if the wording changes, so update the
// label here rather than the key in functions/_lib/loyalty.js.

export const REWARD_LABELS = {
  small_tattoo: "£30 voucher",
  watag_hoodie: "WATAG hoodie",
  in_store_credit: "£100 in-store credit",
};

export function rewardLabel(key) {
  if (!key) return "";
  return REWARD_LABELS[key] || key.replace(/_/g, " ");
}
