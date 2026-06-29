// WATAG — built by Sidedoor Digital
// Intellectual property of Sidedoor Digital

import { useEffect, useRef, useMemo } from "react";

export default function SynthwaveBackground() {
  const canvasRef = useRef(null);

  const stars = useMemo(
    () =>
      Array.from({ length: 50 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 55,
        r: Math.random() * 1.2 + 0.3,
        o: Math.random() * 0.6 + 0.3,
      })),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animFrame;
    let offset = 0;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const vx = w / 2;
      const SEGS = 12;
      const ROWS = 20;

      // vertical lines radiating from vanishing point
      for (let i = 0; i <= SEGS; i++) {
        const xBottom = (i / SEGS) * w;
        ctx.strokeStyle = "rgba(255, 45, 149, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vx, 0);
        ctx.lineTo(xBottom, h);
        ctx.stroke();
      }

      // horizontal lines, perspective spaced, scrolling toward viewer
      for (let i = 0; i < ROWS; i++) {
        const raw = ((i / ROWS) + offset) % 1;
        const t = Math.pow(raw, 2);
        const y = t * h;
        const lineW = t * w * 1.1;
        const alpha = Math.min(t * 1.8, 0.55);

        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vx - lineW / 2, y);
        ctx.lineTo(vx + lineW / 2, y);
        ctx.stroke();
      }

      if (!prefersReducedMotion) {
        offset = (offset + 0.004) % 1;
        animFrame = requestAnimationFrame(draw);
      }
    }

    resize();
    draw();

    const onResize = () => {
      resize();
      if (prefersReducedMotion) draw();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="watag-synth-bg" aria-hidden="true">
      <div className="watag-synth-sky">
        <svg className="watag-synth-stars" width="100%" height="100%">
          {stars.map((s, i) => (
            <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" opacity={s.o} />
          ))}
        </svg>
      </div>
      <div className="watag-synth-horizon" />
      <div className="watag-synth-grid-wrap">
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}