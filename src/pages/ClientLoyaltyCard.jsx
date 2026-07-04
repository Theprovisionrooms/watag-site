// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Client loyalty passport. Verification (email code) only happens once
// per device, the session token is then stored and reused silently on
// every visit after that, same low friction as before, just with a
// real check the first time.

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { NavBack } from "../App.jsx";

const TOKEN_TTL = 60;
const TIERS = [
  { count: 3, label: "small tattoo" },
  { count: 6, label: "session credit" },
  { count: 9, label: "merch" },
];

function useSession() {
  const [session, setSession] = useState(() => ({
    token: localStorage.getItem("watag_session_token") || "",
    name: localStorage.getItem("watag_client_name") || "",
  }));

  const save = (token, name) => {
    localStorage.setItem("watag_session_token", token);
    localStorage.setItem("watag_client_name", name);
    setSession({ token, name });
  };

  const clear = () => {
    localStorage.removeItem("watag_session_token");
    localStorage.removeItem("watag_client_name");
    setSession({ token: "", name: "" });
  };

  return { ...session, save, clear };
}

function ProfileEntry({ onVerified }) {
  const [step, setStep] = useState("details"); // details | code
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const requestCode = async () => {
    setError(null);
    if (!email.includes("@")) {
      setError("enter a valid email");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/clients/request-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ? `couldn't send: ${data.detail}` : "couldn't send the code, try again");
      return;
    }
    setStep("code");
  };

  const verifyCode = async () => {
    setError(null);
    setSubmitting(true);
    const referralCode = localStorage.getItem("watag_referral_code");
    const res = await fetch("/api/clients/verify-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code, name, phone, referralCode }),
    });
    const data = await res.json();
    setSubmitting(false);
    localStorage.removeItem("watag_referral_code");
    if (!res.ok) {
      setError(data.error === "invalid_or_expired_code" ? "wrong code, check your email and try again" : data.error || "something went wrong");
      return;
    }
    onVerified(data.token, data.name);
  };

  if (step === "code") {
    return (
      <div className="watag-screen">
        <NavBack />
        <span className="watag-eyebrow">Check your email</span>
        <h1>Enter your code</h1>
        <p style={{ color: "var(--watag-text-dim)" }}>Sent to {email}, expires in 10 minutes.</p>
        <div className="watag-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            placeholder="6 digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verifyCode()}
            style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 12, borderRadius: 8, fontSize: 20, letterSpacing: 4, textAlign: "center" }}
          />
          {error && <span style={{ color: "var(--watag-pink)", fontSize: 13 }}>{error}</span>}
          <button
            onClick={verifyCode}
            disabled={submitting}
            style={{ background: "var(--watag-pink)", color: "#fff", border: "none", borderRadius: 8, padding: 14, fontWeight: 700 }}
          >
            {submitting ? "checking..." : "verify"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="watag-screen">
      <NavBack />
      <h1>Find your card</h1>
      <p style={{ color: "var(--watag-text-dim)" }}>
        This is only needed once on this phone. After this you're straight in every time, no code, no typing.
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
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 12, borderRadius: 8 }}
        />
        <input
          type="email"
          placeholder="email, for your one-time code"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && requestCode()}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 12, borderRadius: 8 }}
        />
        {error && <span style={{ color: "var(--watag-pink)", fontSize: 13 }}>{error}</span>}
        <button
          onClick={requestCode}
          disabled={submitting}
          style={{ background: "var(--watag-pink)", color: "#fff", border: "none", borderRadius: 8, padding: 14, fontWeight: 700 }}
        >
          {submitting ? "sending..." : "send my code"}
        </button>
      </div>
    </div>
  );
}

export default function ClientLoyaltyCard() {
  const { token, name, save, clear } = useSession();
  const [stampCount, setStampCount] = useState(0);
  const [pendingReward, setPendingReward] = useState(null);
  const [qrToken, setQrToken] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(TOKEN_TTL);
  const [justStamped, setJustStamped] = useState(false);

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchCard = useCallback(async () => {
    const res = await fetch("/api/loyalty/card", { headers: authHeaders() });
    if (res.status === 401) {
      clear();
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setStampCount((prev) => {
      if (data.stampCount > prev) setJustStamped(true);
      return data.stampCount;
    });
    setPendingReward(data.pendingReward);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const refreshQrToken = useCallback(async () => {
    const res = await fetch("/api/loyalty/qr-generate", { method: "POST", headers: authHeaders() });
    if (res.status === 401) {
      clear();
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setQrToken(data.token);
    setSecondsLeft(TOKEN_TTL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchCard();
    refreshQrToken();

    const tokenInterval = setInterval(refreshQrToken, TOKEN_TTL * 1000);
    const cardInterval = setInterval(fetchCard, 5000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(cardInterval);
    };
  }, [token, fetchCard, refreshQrToken]);

  useEffect(() => {
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!justStamped) return;
    const t = setTimeout(() => setJustStamped(false), 400);
    return () => clearTimeout(t);
  }, [justStamped]);

  if (!token) {
    return <ProfileEntry onVerified={save} />;
  }

  const ringProgress = secondsLeft / TOKEN_TTL;
  const circumference = 2 * Math.PI * 92;

  return (
    <div className="watag-screen">
      <NavBack />

      {pendingReward && (
        <div className="watag-card" style={{ borderColor: "var(--watag-amber)" }}>
          <strong style={{ color: "var(--watag-amber)" }}>Reward ready</strong>
          <p style={{ margin: "4px 0 0", color: "var(--watag-text-dim)" }}>
            Show this screen in studio to redeem your {pendingReward.replace("_", " ")}.
          </p>
        </div>
      )}

      <div className="watag-loyalty-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
          <img src="/icons/rabbit-hero.png" alt="" style={{ width: 34, height: "auto" }} />
          <span style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--watag-text-dim)", textTransform: "uppercase" }}>
            Loyalty card
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(9, 1fr)",
            gap: 6,
            position: "relative",
            zIndex: 1,
          }}
        >
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
            const earned = n <= stampCount;
            const isTier = n % 3 === 0;
            return (
              <div
                key={n}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  borderRadius: "50%",
                  border: `1.5px solid ${isTier ? "var(--watag-amber)" : "rgba(255,255,255,0.12)"}`,
                  background: earned ? "rgba(255,255,255,0.06)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="/icons/stamp-mark.png"
                  alt=""
                  style={{
                    width: "72%",
                    height: "72%",
                    objectFit: "contain",
                    filter: earned ? "drop-shadow(0 0 4px rgba(255,45,149,0.6))" : "grayscale(1)",
                    opacity: earned ? 1 : 0.28,
                    transition: "opacity 200ms, filter 200ms",
                  }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{name || "Member"}</span>
          <span style={{ fontSize: 11, color: "var(--watag-text-dim)" }}>{stampCount}/9 stamps</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {TIERS.map((tier) => (
          <span key={tier.count} style={{ fontSize: 11, color: "var(--watag-text-dim)", textTransform: "uppercase" }}>
            {tier.count} · {tier.label}
          </span>
        ))}
      </div>

      <div
        className={`watag-card ${justStamped ? "watag-glitch-once" : ""}`}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 32 }}
      >
        <span style={{ fontSize: 11, color: "var(--watag-text-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          scan to add a stamp
        </span>
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
            {qrToken ? <QRCodeSVG value={qrToken} size={160} /> : <span style={{ color: "#000" }}>loading</span>}
          </div>
        </div>
      </div>

      <p style={{ textAlign: "center", color: "var(--watag-text-dim)", fontSize: 13, margin: 0 }}>
        code refreshes in {secondsLeft}s, hand your phone to staff to scan
      </p>

      <button onClick={clear} style={{ background: "none", border: "none", color: "var(--watag-text-dim)", fontSize: 12 }}>
        not you? switch profile
      </button>
    </div>
  );
}
