// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Owner only. The server checks this too, the redirect here is just
// so a non-owner artist doesn't even see the page rather than hitting
// a wall of 403s.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavBack } from "../App.jsx";
import { staffAuthHeaders } from "../utils/staffAuth.js";

export default function StaffProducts() {
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [staffId, setStaffId] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", loyaltyEligible: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("watag_staff_id");
    const token = localStorage.getItem("watag_staff_token");
    const role = localStorage.getItem("watag_staff_role");
    if (!id || !token) {
      navigate("/staff");
      return;
    }
    if (role !== "owner") {
      navigate("/staff/home");
      return;
    }
    setStaffId(id);
    load();
  }, [navigate]);

  function load() {
    fetch("/api/staff/products")
      .then((res) => res.json())
      .then(setProducts);
  }

  async function addProduct() {
    if (!form.name || !form.price) return;
    setSaving(true);
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("loyaltyEligible", String(form.loyaltyEligible));
    if (fileInput.current.files[0]) formData.append("image", fileInput.current.files[0]);

    await fetch("/api/staff/products", { method: "POST", headers: staffAuthHeaders(), body: formData });
    setForm({ name: "", description: "", price: "", loyaltyEligible: false });
    fileInput.current.value = "";
    setSaving(false);
    load();
  }

  async function deactivate(id) {
    await fetch("/api/staff/products", {
      method: "DELETE",
      headers: { "content-type": "application/json", ...staffAuthHeaders() },
      body: JSON.stringify({ productId: id }),
    });
    load();
  }

  return (
    <div className="watag-screen">
      <NavBack to="/staff/home" label="artist" />
      <h1>Shop items</h1>

      <div className="watag-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <strong>Add an item</strong>
        <input
          placeholder="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8 }}
        />
        <input
          placeholder="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8 }}
        />
        <input
          placeholder="price in pounds, e.g. 12.50"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          style={{ background: "transparent", border: "1px solid var(--watag-border)", color: "var(--watag-text)", padding: 10, borderRadius: 8 }}
        />
        <input ref={fileInput} type="file" accept="image/*" style={{ color: "var(--watag-text-dim)" }} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--watag-text-dim)" }}>
          <input
            type="checkbox"
            checked={form.loyaltyEligible}
            onChange={(e) => setForm({ ...form, loyaltyEligible: e.target.checked })}
          />
          eligible for the 9 stamp loyalty reward
        </label>
        <button
          onClick={addProduct}
          disabled={saving}
          style={{ background: "var(--watag-pink)", color: "#fff", border: "none", borderRadius: 8, padding: 12, fontWeight: 700 }}
        >
          {saving ? "adding..." : "add item"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {products.map((p) => (
          <div key={p.id} className="watag-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: p.active ? 1 : 0.4 }}>
            <div>
              <strong>{p.name}</strong>
              <p style={{ margin: "4px 0 0", color: "var(--watag-text-dim)", fontSize: 13 }}>
                £{(p.price_cents / 100).toFixed(2)} {p.loyalty_eligible ? "· loyalty eligible" : ""} {!p.active ? "· hidden" : ""}
              </p>
            </div>
            {p.active && (
              <button onClick={() => deactivate(p.id)} style={{ background: "none", border: "none", color: "var(--watag-text-dim)" }}>
                remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
