// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";

function shortName(fullName) {
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export default function Referrals() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("watag_session_token");
    if (!token) {
      navigate("/card");
      return;
    }
    fetch("/api/referrals/code", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setData);
    fetch("/api/referrals/leaderboard")
      .then((res) => res.json())
      .then(setLeaderboard);
  }, [navigate]);

  if (!data) return null;

  const link = `${window.location.origin}/r/${data.code}`;

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="watag-screen">
      <NavBack />
      <span className="watag-eyebrow">Refer a friend</span>
      <h1>Your link</h1>
      <p style={{ color: "var(--watag-text-dim)" }}>
        Share this with a mate. Once they've signed up and been in for their first session, you'll get a bonus stamp.
      </p>

      <div className="watag-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "monospace", fontSize: 14, color: "var(--watag-cyan)", wordBreak: "break-all" }}>{link}</div>
        <button
          onClick={copyLink}
          style={{ background: "var(--watag-cyan)", color: "#000", border: "none", borderRadius: 8, padding: 12, fontWeight: 700 }}
        >
          {copied ? "copied" : "copy link"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div className="watag-card" style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--watag-pink)" }}>{data.referredCount}</div>
          <div style={{ fontSize: 12, color: "var(--watag-text-dim)" }}>signed up</div>
        </div>
        <div className="watag-card" style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--watag-amber)" }}>{data.completedCount}</div>
          <div style={{ fontSize: 12, color: "var(--watag-text-dim)" }}>bonus stamps earned</div>
        </div>
      </div>

      {leaderboard.length > 0 && (
        <div>
          <span className="watag-eyebrow">Top referrers</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            {leaderboard.map((entry, i) => (
              <div key={i} className="watag-card" style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px" }}>
                <span>{i + 1}. {shortName(entry.name)}</span>
                <span style={{ color: "var(--watag-text-dim)" }}>{entry.completed} referred</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
