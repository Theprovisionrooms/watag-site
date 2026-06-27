// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";

export default function StaffWaitlist() {
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const id = localStorage.getItem("watag_staff_id");
    if (!id) {
      navigate("/staff");
      return;
    }
    setStaffId(id);
    load(id);
  }, [navigate]);

  function load(id) {
    fetch(`/api/waitlist?staffId=${id}`)
      .then((res) => res.json())
      .then(setEntries);
  }

  async function clear(id) {
    await fetch("/api/waitlist", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load(staffId);
  }

  return (
    <div className="watag-screen">
      <NavBack to="/staff/home" label="artist" />
      <h1>Waitlist</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((e) => (
          <div key={e.id} className="watag-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <strong>{e.client_name}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--watag-text-dim)", fontSize: 13 }}>{e.client_phone}</p>
                <p style={{ margin: "4px 0 0", color: "var(--watag-amber)", fontSize: 13 }}>wants {e.requested_date}</p>
                {e.notes && <p style={{ margin: "4px 0 0", fontSize: 13 }}>{e.notes}</p>}
              </div>
              <button onClick={() => clear(e.id)} style={{ background: "none", border: "none", color: "var(--watag-text-dim)", fontSize: 13 }}>
                done
              </button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p style={{ color: "var(--watag-text-dim)", textAlign: "center" }}>nobody waiting right now</p>}
      </div>
    </div>
  );
}
