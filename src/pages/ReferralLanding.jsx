// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// /r/:code lands here. Stores the code so it survives through the
// signup flow, then sends them on to actually sign up.

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ReferralLanding() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) localStorage.setItem("watag_referral_code", code.toUpperCase());
  }, [code]);

  return (
    <div className="watag-screen">
      <h1>Welcome to WATAG</h1>
      <p style={{ color: "var(--watag-text-dim)" }}>
        Someone's pointed you our way. Set up your card and you're in.
      </p>
      <button
        onClick={() => navigate("/card")}
        style={{ background: "var(--watag-pink)", color: "#fff", border: "none", borderRadius: 8, padding: 14, fontWeight: 700 }}
      >
        get started
      </button>
    </div>
  );
}
