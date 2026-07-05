// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital
//
// Fixed full-screen background video, looping continuously behind
// every screen. muted + playsInline are both required for autoplay on
// mobile Safari and Chrome, browsers block autoplay with sound
// entirely regardless of any other setting, that's a hard platform
// rule, not something to work around.
//
// iOS Safari can still decline to autoplay even with both of those
// set, particularly the first time a PWA is opened from the home
// screen, and shows its own big paused-state play icon when it does.
// To recover from that: explicitly call .play() on mount rather than
// relying on the autoplay attribute alone, and if that gets rejected,
// retry once on the very first tap anywhere on the page, since a real
// user gesture always unlocks playback.
//
// Paused entirely under prefers-reduced-motion rather than just
// hidden, so it doesn't silently keep decoding video in the
// background on a device where motion was deliberately turned down.

import { useEffect, useRef } from "react";

export default function SynthwaveBackground() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      video.pause();
      return;
    }

    video.muted = true;

    const tryPlay = () => video.play().catch(() => {});
    tryPlay();

    function onFirstInteraction() {
      tryPlay();
      document.removeEventListener("touchstart", onFirstInteraction);
      document.removeEventListener("click", onFirstInteraction);
    }
    document.addEventListener("touchstart", onFirstInteraction, { once: true });
    document.addEventListener("click", onFirstInteraction, { once: true });

    return () => {
      document.removeEventListener("touchstart", onFirstInteraction);
      document.removeEventListener("click", onFirstInteraction);
    };
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
        webkit-playsinline="true"
        disablePictureInPicture
        preload="auto"
      />
      <div className="watag-bg-video-overlay" />
    </div>
  );
}
