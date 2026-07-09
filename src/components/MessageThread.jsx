// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Shared message thread UI. Feels instant on the phone, messages land
// within a few seconds, but it's a poll under the hood, not a socket.
// identity is { type: "client", token } or { type: "staff", staffId, token }.
// token is always a real session token now, staffId on the staff side
// is just used for the "is this message mine" check in the UI.
//
// Photos are resized and compressed in the browser before upload (see
// utils/resizeImage.js), that's the main cost control, on top of that
// either the sender or the artist in the thread can delete any message,
// which also removes the R2 object if there's a photo attached, so
// storage doesn't just accumulate forever with no way to clear it down.

import { useEffect, useRef, useState } from "react";
import { NavBack } from "../App.jsx";
import { resizeImageForUpload } from "../utils/resizeImage.js";
import { CameraIcon } from "./icons.jsx";

function getHeaders(identity) {
  return identity.token ? { Authorization: `Bearer ${identity.token}` } : {};
}

function postHeaders(identity) {
  const headers = { "content-type": "application/json" };
  if (identity.token) headers.Authorization = `Bearer ${identity.token}`;
  return headers;
}

export default function MessageThread({ threadId, identity, otherName, subtitle, backTo, accentColor = "var(--watag-pink)" }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileInput = useRef(null);

  async function load() {
    const res = await fetch(`/api/enquiries/messages?threadId=${threadId}`, { headers: getHeaders(identity) });
    if (res.ok) setMessages(await res.json());
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(photoUrl = null) {
    if (!draft.trim() && !photoUrl) return;
    setSending(true);
    const payload = { threadId, body: draft, photoUrl };
    await fetch("/api/enquiries/messages", {
      method: "POST",
      headers: postHeaders(identity),
      body: JSON.stringify(payload),
    });
    setDraft("");
    setSending(false);
    load();
  }

  async function handlePhotoPick(e) {
    const file = e.target.files[0];
    fileInput.current.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const resized = await resizeImageForUpload(file);

      const formData = new FormData();
      formData.append("threadId", threadId);
      formData.append("file", resized);

      const res = await fetch("/api/enquiries/upload-photo", { method: "POST", headers: getHeaders(identity), body: formData });
      const data = await res.json();

      if (res.ok) await send(data.photoUrl);
    } finally {
      setUploading(false);
    }
  }

  async function deleteMessage(messageId) {
    const payload = { messageId };
    await fetch("/api/enquiries/messages", {
      method: "DELETE",
      headers: postHeaders(identity),
      body: JSON.stringify(payload),
    });
    load();
  }

  return (
    <div className="watag-screen" style={{ paddingBottom: 16 }}>
      <NavBack to={backTo} label={otherName} />
      <h1 style={{ fontSize: 26 }}>{otherName}</h1>
      {subtitle && <p style={{ marginTop: -16, color: "var(--watag-cyan)", fontSize: 13 }}>{subtitle}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {messages.map((m) => {
          const mine = m.sender_type === identity.type;
          const canDelete = mine || identity.type === "staff";
          return (
            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              <div
                style={{
                  background: mine ? accentColor : "var(--watag-bg-raised)",
                  color: mine ? "#000" : "var(--watag-text)",
                  border: mine ? "none" : "1px solid var(--watag-border)",
                  borderRadius: 14,
                  padding: m.photo_url ? 6 : "8px 12px",
                  fontSize: 14,
                  overflow: "hidden",
                }}
              >
                {m.photo_url && (
                  <img
                    src={`/media/${m.photo_url}`}
                    alt=""
                    style={{ display: "block", width: "100%", maxWidth: 240, borderRadius: 10, marginBottom: m.body ? 6 : 0 }}
                  />
                )}
                {m.body && <span>{m.body}</span>}
              </div>
              {canDelete && (
                <button
                  onClick={() => deleteMessage(m.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--watag-text-dim)",
                    fontSize: 11,
                    padding: "2px 4px",
                    opacity: 0.6,
                  }}
                >
                  delete
                </button>
              )}
            </div>
          );
        })}
        {messages.length === 0 && (
          <p style={{ color: "var(--watag-text-dim)", textAlign: "center", marginTop: 40 }}>say hello</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, position: "sticky", bottom: 0, paddingTop: 12 }}>
        <input ref={fileInput} type="file" accept="image/*" onChange={handlePhotoPick} style={{ display: "none" }} />
        <button
          onClick={() => fileInput.current.click()}
          disabled={uploading}
          style={{ background: "var(--watag-bg-raised)", border: "1px solid var(--watag-border)", color: "var(--watag-text)", borderRadius: 10, width: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          aria-label="attach a photo"
        >
          <span style={{ width: 20, height: 20, opacity: uploading ? 0.5 : 1 }}>
            <CameraIcon />
          </span>
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="type a message"
          style={{ flex: 1, background: "var(--watag-bg-raised)", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 12, borderRadius: 10 }}
        />
        <button
          onClick={() => send()}
          disabled={sending}
          style={{ background: accentColor, color: "#000", border: "none", borderRadius: 10, padding: "0 18px", fontWeight: 700, flexShrink: 0 }}
        >
          send
        </button>
      </div>
    </div>
  );
}
