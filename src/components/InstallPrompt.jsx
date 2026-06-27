// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Custom "install this" banner. Chrome doesn't pop this up on its own
// any more, it has to be triggered by hand from the beforeinstallprompt
// event. iOS has no equivalent event at all, Safari never lets a site
// trigger its own install, so that side just shows instructions instead.

import { useEffect, useState } from "react";

const DISMISS_KEY = "watag_install_dismissed_at";
const DISMISS_DAYS = 14;

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState(null);
  const [platform, setPlatform] = useState(null); // "ios" | "android"
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed, never nag

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DAYS) return;
    }

    if (isIos()) {
      setPlatform("ios");
      setVisible(true);
      return;
    }

    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredEvent(e);
      setPlatform("android");
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferredEvent) return;
    deferredEvent.prompt();
    await deferredEvent.userChoice;
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        maxWidth: 440,
        margin: "0 auto",
        background: "var(--watag-bg-raised)",
        border: "1px solid var(--watag-border)",
        borderRadius: 14,
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        zIndex: 1000,
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      }}
    >
      <img src="/icons/icon-192.png" alt="" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <strong style={{ fontSize: 14 }}>Get the app</strong>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--watag-text-dim)" }}>
          {platform === "ios"
            ? "Tap the share button, then \"Add to Home Screen\""
            : "Add WATAG to your home screen for quick access"}
        </p>
      </div>
      {platform === "android" && (
        <button
          onClick={install}
          style={{ background: "var(--watag-pink)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, flexShrink: 0 }}
        >
          Install
        </button>
      )}
      <button onClick={dismiss} style={{ background: "none", border: "none", color: "var(--watag-text-dim)", fontSize: 18, padding: 4, flexShrink: 0 }}>
        ×
      </button>
    </div>
  );
}
