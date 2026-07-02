// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Hand-rolled Web Push (RFC 8291 payload encryption, RFC 8292 VAPID
// auth), built entirely on crypto.subtle since the standard `web-push`
// npm package relies on Node's crypto module, which isn't available in
// the Cloudflare Pages Functions runtime. This is the same protocol,
// just implemented against WebCrypto directly.

function base64UrlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const raw = atob(b64 + pad);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatBytes(arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

async function getVapidAuthHeader(env, audience) {
  const publicKeyBytes = base64UrlToBytes(env.VAPID_PUBLIC_KEY);
  const x = bytesToBase64Url(publicKeyBytes.slice(1, 33));
  const y = bytesToBase64Url(publicKeyBytes.slice(33, 65));

  const signingKey = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: env.VAPID_PRIVATE_KEY, x, y, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: env.VAPID_SUBJECT || "mailto:hello@watag.co.uk",
  };

  const encHeader = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsigned = `${encHeader}.${encPayload}`;

  // WebCrypto's ECDSA sign() returns raw r||s directly (not DER), exactly the format a JWT needs
  const sigBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingKey,
    new TextEncoder().encode(unsigned)
  );

  const jwt = `${unsigned}.${bytesToBase64Url(new Uint8Array(sigBuffer))}`;

  return `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`;
}

async function encryptPayload(payloadText, p256dhB64, authB64) {
  const uaPublicKeyBytes = base64UrlToBytes(p256dhB64); // 65 bytes, uncompressed point
  const authSecretBytes = base64UrlToBytes(authB64); // 16 bytes

  const appServerKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
  const appServerPublicRaw = new Uint8Array(await crypto.subtle.exportKey("raw", appServerKeyPair.publicKey));

  const uaPublicKey = await crypto.subtle.importKey(
    "raw",
    uaPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaPublicKey }, appServerKeyPair.privateKey, 256)
  );

  // PRK_combine, folds the subscriber's auth secret in alongside the ECDH shared secret
  const authInfo = concatBytes([
    new TextEncoder().encode("WebPush: info"),
    new Uint8Array([0]),
    uaPublicKeyBytes,
    appServerPublicRaw,
  ]);
  const ikmKey = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveBits"]);
  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: authSecretBytes, info: authInfo }, ikmKey, 256)
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prkKey = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);

  const cek = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("Content-Encoding: aes128gcm\0") },
      prkKey,
      128
    )
  );
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("Content-Encoding: nonce\0") },
      prkKey,
      96
    )
  );

  // delimiter byte (0x02, "last record") appended, no further padding needed for a single-record message
  const plaintext = concatBytes([new TextEncoder().encode(payloadText), new Uint8Array([2])]);

  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, plaintext));

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096);
  const idLen = new Uint8Array([appServerPublicRaw.length]);

  return concatBytes([salt, recordSize, idLen, appServerPublicRaw, ciphertext]);
}

// sends one push message, returns the raw fetch Response so the caller
// can check status (410/404 means the subscription's dead and should
// be deleted)
export async function sendWebPush(env, subscription, payloadObj) {
  const audience = new URL(subscription.endpoint).origin;
  const authHeader = await getVapidAuthHeader(env, audience);
  const body = await encryptPayload(JSON.stringify(payloadObj), subscription.p256dh, subscription.auth);

  return fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
    },
    body,
  });
}

// looks up every device an owner (client or staff) has subscribed
// notifications on, sends to all of them, and quietly removes any
// subscription the push service reports as dead
export async function notifyOwner(env, ownerType, ownerId, payloadObj) {
  const subs = await env.WATAG_DB.prepare(
    `SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE owner_type = ? AND owner_id = ?`
  )
    .bind(ownerType, ownerId)
    .all();

  await Promise.all(
    subs.results.map(async (sub) => {
      try {
        const res = await sendWebPush(env, sub, payloadObj);
        if (res.status === 404 || res.status === 410) {
          await env.WATAG_DB.prepare(`DELETE FROM push_subscriptions WHERE id = ?`).bind(sub.id).run();
        }
      } catch (err) {
        console.error("push send failed", err);
      }
    })
  );
}
