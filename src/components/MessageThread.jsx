// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Shared message thread UI. Feels instant on the phone, messages land
// within a few seconds, but it's a poll under the hood, not a socket.
// identity is { type: "client", token } or { type: "staff", staffId }.

import { useEffect, useRef, useState } from "react";
import { NavBack } from "../App.jsx";

function getUrl(threadId, identity) {
  let url = `/api/enquiries/messages?threadId=${threadId}`;
  if (identity.type === "staff") url += `&staffId=${identity.staffId}`;
  return url;
}

function getHeaders(identity) {
  return identity.type === "client" ? { Authorization: `Bearer ${identity.token}` } : {};
}

function postBody(threadId, text, identity) {
  const payload = { threadId, body: text };
  if (identity.type === "staff") payload.staffId = identity.staffId;
  return payload;
}

function postHeaders(identity) {
  const headers = { "content-type": "application/json" };
  if (identity.type === "client") headers.Authorization = `Bearer ${identity.token}`;
  return headers;
}

export default function MessageThread({ threadId, identity, otherName, backTo, accentColor = "var(--watag-pink)" }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  async function load() {
    const res = await fetch(getUrl(threadId, identity), { headers: getHeaders(identity) });
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

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    await fetch("/api/enquiries/messages", {
      method: "POST",
      headers: postHeaders(identity),
      body: JSON.stringify(postBody(threadId, draft, identity)),
    });
    setDraft("");
    setSending(false);
    load();
  }

  return (
    <div className="watag-screen" style={{ paddingBottom: 16 }}>
      <NavBack to={backTo} label={otherName} />
      <h1 style={{ fontSize: 26 }}>{otherName}</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {messages.map((m) => {
          const mine = m.sender_type === identity.type;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "80%",
                background: mine ? accentColor : "var(--watag-bg-raised)",
                color: mine ? "#000" : "var(--watag-text)",
                border: mine ? "none" : "1px solid var(--watag-border)",
                borderRadius: 14,
                padding: "8px 12px",
                fontSize: 14,
              }}
            >
              {m.body}
            </div>
          );
        })}
        {messages.length === 0 && (
          <p style={{ color: "var(--watag-text-dim)", textAlign: "center", marginTop: 40 }}>say hello</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, position: "sticky", bottom: 0, paddingTop: 12 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="type a message"
          style={{ flex: 1, background: "var(--watag-bg-raised)", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 12, borderRadius: 10 }}
        />
        <button
          onClick={send}
          disabled={sending}
          style={{ background: accentColor, color: "#000", border: "none", borderRadius: 10, padding: "0 18px", fontWeight: 700 }}
        >
          send
        </button>
      </div>
    </div>
  );
}
