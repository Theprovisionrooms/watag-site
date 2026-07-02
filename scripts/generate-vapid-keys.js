// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Generates a fresh VAPID keypair for Web Push. Run once, set the two
// output values per the README's "push notifications setup" section,
// then close your terminal afterwards rather than leaving the keys
// sitting visible in scrollback. Don't commit the actual key values
// anywhere.
//
// Run with: node scripts/generate-vapid-keys.js

import crypto from "crypto";

function toBase64Url(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });

// SPKI DER encoding for a P-256 key always ends in the same 65-byte
// uncompressed point (0x04 || x || y), which is exactly the raw format
// VAPID_PUBLIC_KEY needs to be in.
const publicKeyRaw = publicKey.export({ type: "spki", format: "der" }).slice(-65);

const privateKeyJwk = privateKey.export({ format: "jwk" });
const privateKeyRaw = Buffer.from(privateKeyJwk.d, "base64url");

console.log("");
console.log("VAPID_PUBLIC_KEY  (also goes in the frontend build var, see README):");
console.log(toBase64Url(publicKeyRaw));
console.log("");
console.log("VAPID_PRIVATE_KEY (server secret, never goes in frontend code):");
console.log(toBase64Url(privateKeyRaw));
console.log("");