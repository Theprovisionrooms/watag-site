// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Fixed full-screen background video, looping continuously behind
// every screen. Muted and playsInline are both required for this to
// autoplay on mobile Safari and Chrome, browsers block autoplay with
// sound regardless of any other setting. Paused entirely under
// prefers-reduced-motion rather than just hidden, so it doesn't
// silently keep decoding video in the background on a device where
// motion was deliberately turned down.

import { useEffect, useRef } from "react";

export default function SynthwaveBackground() {
  const videoRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion && videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  return (
    <div className="watag-synth-bg" aria-hidden="true">
      <video
        ref={videoRef}
        className="watag-bg-video"
        src="/backgrounds/loop.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
      <div className="watag-bg-video-overlay" />
    </div>
  );
}
