// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Owner only. The server checks this too, the redirect here is just
// so a non-owner artist doesn't even see the page.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";

function StatBlock({ label, value, accent = "var(--watag-cyan)" }) {
  return (
    <div className="watag-card" style={{ flex: 1 }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--watag-text-dim)" }}>{label}</div>
    </div>
  );
}

export default function StaffStats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("watag_staff_id");
    const role = localStorage.getItem("watag_staff_role");
    if (!id) {
      navigate("/staff");
      return;
    }
    if (role !== "owner") {
      navigate("/staff/home");
      return;
    }
    fetch(`/api/staff/stats?staffId=${id}`)
      .then((res) => res.json())
      .then(setStats);
  }, [navigate]);

  if (!stats) {
    return (
      <div className="watag-screen">
        <NavBack to="/staff/home" label="artist" />
        <h1>Stats</h1>
        <p style={{ color: "var(--watag-text-dim)" }}>loading...</p>
      </div>
    );
  }

  const clickRate = stats.reviewNudges.sent > 0 ? Math.round((stats.reviewNudges.clicked / stats.reviewNudges.sent) * 100) : 0;

  return (
    <div className="watag-screen">
      <NavBack to="/staff/home" label="artist" />
      <span className="watag-eyebrow">Owner only</span>
      <h1>Stats</h1>

      <div style={{ display: "flex", gap: 10 }}>
        <StatBlock label="revenue (paid)" value={`£${(stats.revenue.totalCents / 100).toFixed(0)}`} accent="var(--watag-pink)" />
        <StatBlock label="orders" value={stats.revenue.ordersCount} />
      </div>

      {stats.topProducts.length > 0 && (
        <div className="watag-card">
          <strong style={{ fontSize: 13 }}>Top sellers</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {stats.topProducts.map((p) => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{p.name}</span>
                <span style={{ color: "var(--watag-text-dim)" }}>{p.qty} sold · £{(p.revenue_cents / 100).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <StatBlock label="clients" value={stats.clients.total} accent="var(--watag-amber)" />
        <StatBlock label="new this month" value={stats.clients.newThisMonth} accent="var(--watag-amber)" />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <StatBlock label="stamps issued" value={stats.loyalty.stampsTotal} />
        <StatBlock label="stamps this month" value={stats.loyalty.stampsThisMonth} />
      </div>

      {stats.loyalty.pendingRewards.length > 0 && (
        <div className="watag-card">
          <strong style={{ fontSize: 13 }}>Rewards waiting to be redeemed</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {stats.loyalty.pendingRewards.map((r) => (
              <div key={r.pending_reward} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{r.pending_reward.replace("_", " ")}</span>
                <span style={{ color: "var(--watag-text-dim)" }}>{r.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <StatBlock label="enquiry threads" value={stats.enquiries.threadCount} accent="var(--watag-purple)" />
        <StatBlock label="messages this week" value={stats.enquiries.messagesThisWeek} accent="var(--watag-purple)" />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <StatBlock label="reviews sent" value={stats.reviewNudges.sent} />
        <StatBlock label="click rate" value={`${clickRate}%`} />
      </div>

      <StatBlock label="on the waitlist" value={stats.waitlist.open} accent="var(--watag-amber)" />
    </div>
  );
}
