// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET /api/reviews/click?id=123
// Records that a review nudge was actually clicked, then redirects to
// the real Google review page.

const GOOGLE_REVIEW_URL = "https://g.page/r/CYEZZgWtNcfBEAE/review";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    await env.WATAG_DB.prepare(`UPDATE review_nudges SET clicked_at = datetime('now') WHERE id = ? AND clicked_at IS NULL`)
      .bind(id)
      .run();
  }

  return Response.redirect(GOOGLE_REVIEW_URL, 302);
}
