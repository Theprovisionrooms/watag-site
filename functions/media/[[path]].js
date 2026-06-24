// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// GET /media/<key>
// Streams a file straight out of the R2 bucket. Keeps gallery images
// served from our own domain rather than exposing the bucket publicly.

export async function onRequestGet({ params, env }) {
  const key = Array.isArray(params.path) ? params.path.join("/") : params.path;

  const object = await env.WATAG_MEDIA.get(key);
  if (!object) {
    return new Response("not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
