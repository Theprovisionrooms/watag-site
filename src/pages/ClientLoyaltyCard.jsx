// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Client loyalty passport. Shows stamp progress toward the 3/6/9 tiers
// and a QR code that rotates every 60 seconds so an old screenshot
// can't be reused to fake a stamp.

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { NavBack } from "../App.jsx";

const TOKEN_TTL = 60;
const TIERS = [
  { count: 3, label: "small tattoo" },
  { count: 6, label: "merch" },
  { count: 9, label: "3hr session" },
];

function useClientId() {
  const [clientId, setClientId] = useState(() => localStorage.getItem("watag_client_id") || "");

  const save = (id) => {
    localStorage.setItem("watag_client_id", id);
    setClientId(id);
  };

  return [clientId, save];
}

function ProfileEntry({ onAccess }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/clients/access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "something went wrong, try again");
      return;
    }
    localStorage.setItem("watag_client_name", data.name);
    onAccess(String(data.clientId));
  };

  return (
    <div className="watag-screen">
      <NavBack />
      <span className="watag-eyebrow">Your card</span>
      <h1>Find your card</h1>
      <p style={{ color: "var(--watag-text-dim)" }}>
        First time, this sets up your card. Been before, just pop in the same phone number and you're straight back in.
      </p>
      <div className="watag-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="text"
          placeholder="your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 12, borderRadius: 8 }}
        />
        <input
          type="tel"
          placeholder="phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 12, borderRadius: 8 }}
        />
        {error && <span style={{ color: "var(--watag-pink)", fontSize: 13 }}>{error}</span>}
        <button
          onClick={submit}
          disabled={submitting}
          style={{ background: "var(--watag-pink)", color: "#fff", border: "none", borderRadius: 8, padding: 14, fontWeight: 700 }}
        >
          {submitting ? "one sec..." : "find my card"}
        </button>
      </div>
    </div>
  );
}

export default function ClientLoyaltyCard() {
  const [clientId, setClientId] = useClientId();
  const [stampCount, setStampCount] = useState(0);
  const [pendingReward, setPendingReward] = useState(null);
  const [token, setToken] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(TOKEN_TTL);
  const [justStamped, setJustStamped] = useState(false);

  const fetchCard = useCallback(async (id) => {
    const res = await fetch(`/api/loyalty/card?clientId=${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setStampCount((prev) => {
      if (data.stampCount > prev) setJustStamped(true);
      return data.stampCount;
    });
    setPendingReward(data.pendingReward);
  }, []);

  const refreshToken = useCallback(async (id) => {
    const res = await fetch("/api/loyalty/qr-generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId: id }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setToken(data.token);
    setSecondsLeft(TOKEN_TTL);
  }, []);

  // initial load and token rotation
  useEffect(() => {
    if (!clientId) return;
    fetchCard(clientId);
    refreshToken(clientId);

    const tokenInterval = setInterval(() => refreshToken(clientId), TOKEN_TTL * 1000);
    // poll the card status a little more often than the token, catches a stamp
    // that just landed while this screen is open
    const cardInterval = setInterval(() => fetchCard(clientId), 5000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(cardInterval);
    };
  }, [clientId, fetchCard, refreshToken]);

  useEffect(() => {
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!justStamped) return;
    const t = setTimeout(() => setJustStamped(false), 400);
    return () => clearTimeout(t);
  }, [justStamped]);

  if (!clientId) {
    return <ProfileEntry onAccess={setClientId} />;
  }

  const ringProgress = secondsLeft / TOKEN_TTL;
  const circumference = 2 * Math.PI * 92;

  return (
    <div className="watag-screen">
      <NavBack />
      <span className="watag-eyebrow">Loyalty passport</span>
      <h1 style={{ fontSize: 32 }}>Your card</h1>

      {pendingReward && (
        <div className="watag-card" style={{ borderColor: "var(--watag-amber)" }}>
          <strong style={{ color: "var(--watag-amber)" }}>Reward ready</strong>
          <p style={{ margin: "4px 0 0", color: "var(--watag-text-dim)" }}>
            Show this screen in studio to redeem your {pendingReward.replace("_", " ")}.
          </p>
        </div>
      )}

      <div
        className={`watag-card ${justStamped ? "watag-glitch-once" : ""}`}
        style={{ display: "flex", justifyContent: "center", padding: 32 }}
      >
        <div style={{ position: "relative", width: 220, height: 220 }}>
          <svg width="220" height="220" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
            <circle cx="110" cy="110" r="92" fill="none" stroke="var(--watag-bg)" strokeWidth="6" />
            <circle
              cx="110"
              cy="110"
              r="92"
              fill="none"
              stroke="var(--watag-cyan)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ringProgress)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 18,
              width: 184,
              height: 184,
              background: "#fff",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {token ? <QRCodeSVG value={token} size={160} /> : <span style={{ color: "#000" }}>loading</span>}
          </div>
        </div>
      </div>

      <p style={{ textAlign: "center", color: "var(--watag-text-dim)", fontSize: 13, margin: 0 }}>
        code refreshes in {secondsLeft}s, hand your phone to staff to scan
      </p>

      <div className="watag-card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          {TIERS.map((tier) => (
            <span key={tier.count} style={{ fontSize: 11, color: "var(--watag-text-dim)", textTransform: "uppercase" }}>
              {tier.count} · {tier.label}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              style={{
                flex: 1,
                aspectRatio: "1",
                borderRadius: "50%",
                border: `2px solid ${n % 3 === 0 ? "var(--watag-amber)" : "var(--watag-border)"}`,
                background: n <= stampCount ? "var(--watag-pink)" : "transparent",
                transition: "background 200ms",
              }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          localStorage.removeItem("watag_client_id");
          localStorage.removeItem("watag_client_name");
          setClientId("");
        }}
        style={{ background: "none", border: "none", color: "var(--watag-text-dim)", fontSize: 12 }}
      >
        not you? switch profile
      </button>
    </div>
  );
}
