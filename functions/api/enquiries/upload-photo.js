// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// POST /api/enquiries/upload-photo
// multipart form: threadId, file  (+ staffId for staff, Authorization header for clients)
// Returns { photoUrl } to reference when calling POST /api/enquiries/messages.
// The heavy lifting on cost happens client side, MessageThread.jsx
// resizes and compresses the image in the browser before it ever
// reaches here, this endpoint just stores whatever it's given.

import { resolveClientSession } from "../../_lib/session.js";
import { authoriseThread } from "../../_lib/enquiries.js";

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const threadId = formData.get("threadId");
  const staffId = formData.get("staffId");
  const file = formData.get("file");

  if (!threadId || !file) {
    return new Response(JSON.stringify({ error: "threadId and file are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  let viewer;
  const clientId = await resolveClientSession(request, env);
  if (clientId) {
    viewer = { type: "client", id: clientId };
  } else if (staffId) {
    viewer = { type: "staff", id: Number(staffId) };
  } else {
    return new Response(JSON.stringify({ error: "not_signed_in" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const thread = await authoriseThread(env, threadId, viewer);
  if (!thread) {
    return new Response(JSON.stringify({ error: "not_your_thread" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const key = `enquiries/${threadId}/${Date.now()}-${safeFilename(file.name || "photo.jpg")}`;
  await env.WATAG_MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "image/jpeg" },
  });

  return new Response(JSON.stringify({ photoUrl: key }), {
    headers: { "content-type": "application/json" },
  });
}
