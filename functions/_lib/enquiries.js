// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Shared helper for anything touching an enquiry thread. Confirms the
// viewer (client or staff) actually owns/belongs to the thread they're
// trying to read, post to, or upload into.

export async function authoriseThread(env, threadId, viewer) {
  const thread = await env.WATAG_DB.prepare(`SELECT client_id, staff_id FROM enquiry_threads WHERE id = ?`)
    .bind(threadId)
    .first();

  if (!thread) return null;
  const owns = viewer.type === "client" ? thread.client_id === viewer.id : thread.staff_id === viewer.id;
  return owns ? thread : null;
}
