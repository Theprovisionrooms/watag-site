// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Staff scan view. Reads the camera through the browser (no native API
// needed), decodes the client's rotating QR token with jsQR, and submits
// the stamp. Shows a HUD style viewfinder, flashes the brand glitch on a
// successful stamp.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import { NavBack } from "../App.jsx";

export default function StaffScan() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState(null);
  const [status, setStatus] = useState("scanning"); // scanning | submitting | success | error
  const [message, setMessage] = useState("");
  const scanningRef = useRef(true);

  useEffect(() => {
    const id = localStorage.getItem("watag_staff_id");
    if (!id) {
      navigate("/staff");
      return;
    }
    setStaffId(id);
  }, [navigate]);

  useEffect(() => {
    let stream;
    let rafId;

    async function start() {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      tick();
    }

    function tick() {
      if (!scanningRef.current) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          handleDecoded(code.data);
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    start().catch(() => setMessage("camera access needed to scan"));

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (rafId) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  async function handleDecoded(token) {
    if (status === "submitting") return;
    scanningRef.current = false;
    setStatus("submitting");

    const res = await fetch("/api/loyalty/scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, staffId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(
        data.error === "cooldown_active"
          ? `already stamped, wait ${data.retryAfterSeconds}s`
          : data.error === "token_expired"
          ? "code expired, ask them to refresh their card"
          : "scan didn't go through, try again"
      );
    } else {
      setStatus("success");
      setMessage(
        data.pendingReward
          ? `stamp ${data.stampCount}/9, reward ready: ${data.pendingReward.replace("_", " ")}`
          : `stamp ${data.stampCount}/9`
      );
    }
  }

  function scanNext() {
    setStatus("scanning");
    setMessage("");
    scanningRef.current = true;
  }

  return (
    <div className="watag-screen">
      <NavBack to="/staff/home" label="staff" />
      <h1>Scan card</h1>

      <div
        className={status === "success" ? "watag-glitch-once" : ""}
        style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#000" }}
      >
        <video ref={videoRef} style={{ width: "100%", display: "block" }} muted playsInline />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* hud corner brackets */}
        <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[
            "M10,25 L10,10 L25,10",
            "M75,10 L90,10 L90,25",
            "M90,75 L90,90 L75,90",
            "M25,90 L10,90 L10,75",
          ].map((d) => (
            <path key={d} d={d} fill="none" stroke="var(--watag-cyan)" strokeWidth="1.5" />
          ))}
        </svg>

        {status !== "scanning" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(10,10,18,0.85)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: 24,
              textAlign: "center",
            }}
          >
            {status === "submitting" && <span>checking...</span>}
            {status === "success" && (
              <>
                <strong style={{ color: "var(--watag-cyan)", fontSize: 20 }}>stamped</strong>
                <span style={{ color: "var(--watag-text-dim)" }}>{message}</span>
                <button onClick={scanNext} style={{ background: "var(--watag-cyan)", color: "#000", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700 }}>
                  scan next
                </button>
              </>
            )}
            {status === "error" && (
              <>
                <strong style={{ color: "var(--watag-pink)", fontSize: 20 }}>not stamped</strong>
                <span style={{ color: "var(--watag-text-dim)" }}>{message}</span>
                <button onClick={scanNext} style={{ background: "var(--watag-pink)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700 }}>
                  try again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <p style={{ color: "var(--watag-text-dim)", fontSize: 13, textAlign: "center" }}>
        line the customer's QR code up in frame
      </p>
    </div>
  );
}
