// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Every staff API call needs the session token from login, not the
// staffId, that's just for display and for endpoints where it's a
// genuine data reference (e.g. "which artist is this waitlist entry
// for") rather than a claim about who's calling.

export function staffAuthHeaders() {
  const token = localStorage.getItem("watag_staff_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
