import { useEffect, useRef } from "react";
import { climateAt, formationAt, formatAge, kaToT, tToKa, KA_MAX, KA_MIN, FORMATIONS } from "../engine/climate";
import { rngFrom, clamp } from "../engine/rng";

/** The time control is a sediment core, not a slider.
 *
 *  The bands are Upper Siwalik lithology, the boundaries are real formation
 *  contacts, and the curve is the glacial/interglacial pacing. Dragging it
 *  is the app's primary verb, so it is worth being an object rather than a
 *  widget. */
export default function CoreScrubber({ ka, onChange }: { ka: number; onChange: (ka: number) => void }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const el = stripRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    const draw = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const g = canvas.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);

      // lithology
      for (let x = 0; x < w; x++) {
        const age = tToKa(x / w);
        const fm = formationAt(age);
        const idx = Math.floor((Math.sin(age / 7.3) * 0.5 + 0.5) * fm.bands.length) % fm.bands.length;
        g.globalAlpha = 0.5;
        g.fillStyle = fm.bands[idx];
        g.fillRect(x, 0, 1, h);
      }
      g.globalAlpha = 1;

      // grain
      const lr = rngFrom("litho-grain");
      for (let i = 0; i < w * 1.8; i++) {
        g.fillStyle = `rgba(14,20,23,${(lr() * 0.26).toFixed(3)})`;
        g.fillRect(lr() * w, lr() * h, 1 + lr() * 1.8, 1);
      }

      // formation contacts
      g.strokeStyle = "rgba(14,20,23,0.85)";
      g.lineWidth = 1;
      for (const f of FORMATIONS) {
        if (f.to <= KA_MIN) continue;
        const x = Math.round(kaToT(f.to) * w) + 0.5;
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, h);
        g.stroke();
      }

      // glacial cycling
      g.beginPath();
      for (let x = 0; x <= w; x++) {
        const y = h - 4 - climateAt(tToKa(x / w)).warmth * (h - 12);
        x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.strokeStyle = "rgba(232,227,214,0.66)";
      g.lineWidth = 1.1;
      g.stroke();
      g.lineTo(w, h);
      g.lineTo(0, h);
      g.closePath();
      g.fillStyle = "rgba(143,183,196,0.09)";
      g.fill();

      // mid-Pleistocene transition: cycles lengthen from 41 to 100 kyr here
      const mx = Math.round(kaToT(1000) * w) + 0.5;
      g.setLineDash([2, 3]);
      g.strokeStyle = "rgba(192,138,46,0.6)";
      g.beginPath();
      g.moveTo(mx, 0);
      g.lineTo(mx, h);
      g.stroke();
      g.setLineDash([]);
      if (mx < w - 80) {
        g.fillStyle = "rgba(14,20,23,0.82)";
        g.fillRect(mx + 3, h - 13, 27, 11);
        g.fillStyle = "rgba(192,138,46,0.95)";
        g.font = '9px "IBM Plex Mono", monospace';
        g.fillText("MPT", mx + 6, h - 4.5);
      }

      g.strokeStyle = "rgba(34,48,53,0.95)";
      g.strokeRect(0.5, 0.5, w - 1, h - 1);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const kaFromClientX = (clientX: number) => {
    const el = stripRef.current;
    if (!el) return ka;
    const r = el.getBoundingClientRect();
    return tToKa(clamp((clientX - r.left) / r.width, 0, 1));
  };

  const fm = formationAt(ka);

  return (
    <div className="core">
      <div className="core-head">
        <div className="fm">
          Formation · <b>{fm.name}</b>
        </div>
        <div className="age">
          {ka >= 1000 ? (ka / 1000).toFixed(2) : (ka / 1000).toFixed(3)} <span>Ma before present</span>
        </div>
      </div>

      <div
        className="core-strip"
        ref={stripRef}
        role="slider"
        tabIndex={0}
        aria-label="Time — thousands of years before present"
        aria-valuemin={KA_MIN}
        aria-valuemax={KA_MAX}
        aria-valuenow={Math.round(ka)}
        aria-valuetext={formatAge(ka)}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          onChange(kaFromClientX(e.clientX));
        }}
        onPointerMove={(e) => dragging.current && onChange(kaFromClientX(e.clientX))}
        onPointerUp={(e) => {
          dragging.current = false;
          try {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
          } catch {
            /* already released */
          }
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 100 : 15;
          if (e.key === "ArrowLeft") {
            onChange(clamp(ka + step, KA_MIN, KA_MAX));
            e.preventDefault();
          }
          if (e.key === "ArrowRight") {
            onChange(clamp(ka - step, KA_MIN, KA_MAX));
            e.preventDefault();
          }
        }}
      >
        <canvas ref={canvasRef} />
        <div className="needle" style={{ left: `${kaToT(ka) * 100}%` }} />
      </div>

      <div className="core-axis">
        <span>2.58 Ma — base Pleistocene</span>
        <span>11.7 ka — Holocene</span>
      </div>
    </div>
  );
}
