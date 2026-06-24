// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Live rota. Stacked day cards rather than a wide grid, reads better
// on a phone than a traditional week-view table.

import { useEffect, useState } from "react";
import { NavBack } from "../App.jsx";

function weekDates() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function dayLabel(iso) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export default function Calendar() {
  const [staff, setStaff] = useState([]);
  const [blocksByDay, setBlocksByDay] = useState({});
  const dates = weekDates();

  useEffect(() => {
    fetch("/api/staff/list")
      .then((res) => res.json())
      .then(async (staffList) => {
        setStaff(staffList);
        const from = dates[0];
        const to = dates[dates.length - 1];

        const allBlocks = await Promise.all(
          staffList.map((s) =>
            fetch(`/api/staff/availability?staffId=${s.id}&from=${from}&to=${to}`).then((r) => r.json())
          )
        );

        const grouped = {};
        allBlocks.flat().forEach((b) => {
          if (!grouped[b.date]) grouped[b.date] = [];
          grouped[b.date].push(b);
        });
        setBlocksByDay(grouped);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="watag-screen">
      <NavBack />
      <span className="watag-eyebrow">This week</span>
      <h1 style={{ fontSize: 32 }}>Who's working</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {staff.map((s) => (
          <span key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--watag-text-dim)" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.calendar_color, display: "inline-block" }} />
            {s.name}
          </span>
        ))}
      </div>

      {dates.map((date) => {
        const blocks = blocksByDay[date] || [];
        return (
          <div key={date} className="watag-card">
            <strong style={{ display: "block", marginBottom: blocks.length ? 10 : 0 }}>{dayLabel(date)}</strong>
            {blocks
              .filter((b) => b.status !== "off")
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((b) => {
                const member = staff.find((s) => s.id === b.staff_id);
                return (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: b.calendar_color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14 }}>
                      {member?.name || "staff"} · {b.start_time}–{b.end_time}
                      {b.status === "booked" && <span style={{ color: "var(--watag-text-dim)" }}> · booked</span>}
                    </span>
                  </div>
                );
              })}
            {blocks.filter((b) => b.status !== "off").length === 0 && (
              <span style={{ fontSize: 13, color: "var(--watag-text-dim)" }}>nobody booked in yet</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
