import { useCallback, useEffect, useRef, useState } from "react";
import type { Terrain } from "../engine/terrain";
import { METRES_PER_CELL } from "../engine/terrain";
import type { Climate } from "../engine/climate";
import type { Spawn } from "../engine/spawns";
import { lerp, rngFrom } from "../engine/rng";
import type { Tier } from "../engine/species";

export interface View {
  cx: number;
  cy: number;
  scale: number;
}

const SPOOR: Record<Tier, string> = {
  here: "M8 3 C11 3 12 6 11 8 C10 10 6 10 5 8 C4 6 5 3 8 3 Z M4 12 c1.6-.6 2.6.6 2 1.9 -.6 1.3-2.6 1.1-3-.2 -.3-1 .2-1.5 1-1.7 Z M11.6 12 c1.6-.6 2.6.6 2 1.9 -.6 1.3-2.6 1.1-3-.2 -.3-1 .2-1.5 1-1.7 Z",
  formation: "M8 2.6 L13 8.4 L10.6 8.4 L10.6 13.6 L5.4 13.6 L5.4 8.4 L3 8.4 Z",
  world: "M8 2.4 a5.6 5.6 0 1 0 0.01 0 Z M8 5.6 a2.4 2.4 0 1 1 -0.01 0 Z"
};

const TIER_COLOR: Record<Tier, string> = {
  here: "#c08a2e",
  formation: "#7e9aa6",
  world: "#5e6b6f"
};

interface Props {
  terrain: Terrain;
  climate: Climate;
  spawns: Spawn[];
  loggedKeys: Set<string>;
  onSelect: (s: Spawn) => void;
}

export default function MapView({ terrain, climate, spawns, loggedKeys, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>({ cx: terrain.size / 2, cy: terrain.size / 2, scale: 2.6 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  /* ── viewport ─────────────────────────────────────────────────── */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clampView = useCallback(
    (v: View): View => {
      const halfW = size.w / 2 / v.scale;
      const halfH = size.h / 2 / v.scale;
      const pad = 20;
      return {
        scale: v.scale,
        cx: Math.max(Math.min(halfW, terrain.size - pad), Math.min(v.cx, Math.max(terrain.size - halfW, pad))),
        cy: Math.max(Math.min(halfH, terrain.size - pad), Math.min(v.cy, Math.max(terrain.size - halfH, pad)))
      };
    },
    [size.w, size.h, terrain.size]
  );

  const toScreen = useCallback(
    (cellX: number, cellY: number) => ({
      x: (cellX - view.cx) * view.scale + size.w / 2,
      y: (cellY - view.cy) * view.scale + size.h / 2
    }),
    [view, size]
  );

  /* ── interaction ──────────────────────────────────────────────── */
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const dx = (e.clientX - drag.current.x) / view.scale;
    const dy = (e.clientY - drag.current.y) / view.scale;
    setView((v) => clampView({ ...v, cx: drag.current!.cx - dx, cy: drag.current!.cy - dy }));
  };
  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drag.current = null;
    setDragging(false);
    try {
      (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  const zoomBy = useCallback(
    (factor: number, anchor?: { x: number; y: number }) => {
      setView((v) => {
        const scale = Math.max(1.1, Math.min(14, v.scale * factor));
        if (!anchor) return clampView({ ...v, scale });
        // Keep the cell under the cursor fixed while the scale changes.
        const cellX = (anchor.x - size.w / 2) / v.scale + v.cx;
        const cellY = (anchor.y - size.h / 2) / v.scale + v.cy;
        return clampView({
          scale,
          cx: cellX - (anchor.x - size.w / 2) / scale,
          cy: cellY - (anchor.y - size.h / 2) / scale
        });
      });
    },
    [clampView, size]
  );

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  /* ── render ───────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    const g = canvas.getContext("2d");
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const warm = climate.warmth;
    const sx = (cx: number) => (cx - view.cx) * view.scale + size.w / 2;
    const sy = (cy: number) => (cy - view.cy) * view.scale + size.h / 2;

    // ground
    const bg = g.createLinearGradient(0, 0, 0, size.h);
    bg.addColorStop(0, `rgb(${Math.round(lerp(16, 21, warm))},${Math.round(lerp(23, 28, warm))},27)`);
    bg.addColorStop(1, `rgb(${Math.round(lerp(11, 15, warm))},${Math.round(lerp(16, 20, warm))},19)`);
    g.fillStyle = bg;
    g.fillRect(0, 0, size.w, size.h);

    // contours — extracted once in survey space, only transformed here
    g.lineCap = "round";
    terrain.contours.forEach((level, i) => {
      const t = i / terrain.contours.length;
      const high = t > 0.72;
      g.strokeStyle = high
        ? `rgba(150,190,203,${lerp(0.62, 0.3, warm).toFixed(3)})`
        : level.index
          ? "rgba(122,156,169,0.95)"
          : "rgba(78,106,117,0.8)";
      g.lineWidth = level.index ? 1.25 : 0.8;
      g.beginPath();
      const seg = level.segments;
      for (let k = 0; k < seg.length; k += 4) {
        g.moveTo(sx(seg[k]), sy(seg[k + 1]));
        g.lineTo(sx(seg[k + 2]), sy(seg[k + 3]));
      }
      g.stroke();
    });

    // Channels widen downstream with their own flow accumulation, so a trunk
    // reads as a trunk and its tributaries stay hairlines. Segments are
    // bucketed by width so the whole network still draws in a few strokes.
    g.lineJoin = "round";
    g.strokeStyle = `rgba(122,163,177,${lerp(0.42, 0.78, warm).toFixed(3)})`;
    const zoomK = Math.min(1.9, view.scale / 2.6);
    const buckets = new Map<number, Path2D>();
    for (const line of terrain.channels) {
      for (let i = 1; i < line.length; i++) {
        const raw = (0.12 + Math.log10(Math.max(1, line[i][2])) * 0.46) * lerp(0.55, 1.15, warm) * zoomK;
        const w = Math.max(0.5, Math.round(raw * 2) / 2);
        let path = buckets.get(w);
        if (!path) {
          path = new Path2D();
          buckets.set(w, path);
        }
        path.moveTo(sx(line[i - 1][0]), sy(line[i - 1][1]));
        path.lineTo(sx(line[i][0]), sy(line[i][1]));
      }
    }
    for (const [w, path] of buckets) {
      g.lineWidth = w;
      g.stroke(path);
    }

    // vegetation — which candidates render is decided by the climate,
    // so scrubbing through time is instant
    const vr = rngFrom("veg-draw");
    const f = terrain.facies.vegetation;
    g.lineWidth = 0.9;
    for (const v of terrain.vegetation) {
      if (v.e < f.min || v.e > f.max) continue;
      if (vr() > lerp(0.25, 1, warm) * f.density) continue;
      const x = sx(v.x);
      const y = sy(v.y);
      if (x < -10 || x > size.w + 10 || y < -10 || y > size.h + 10) continue;
      g.strokeStyle = `rgba(110,143,74,${(lerp(0.34, 0.8, warm) * (0.45 + v.s * 0.4)).toFixed(3)})`;
      const s = (2.2 + v.s * 3.4) * Math.min(1.5, view.scale / 2.6);
      g.beginPath();
      g.moveTo(x, y + s);
      g.lineTo(x + (v.s - 0.8) * 2.4, y);
      g.lineTo(x + (v.s - 0.6) * 3.2, y - s * 0.7);
      g.stroke();
    }

    // cold wash at the glacial end
    if (warm < 0.42) {
      const k = (0.42 - warm) / 0.42;
      const ig = g.createLinearGradient(0, 0, 0, size.h);
      ig.addColorStop(0, `rgba(143,183,196,${(0.12 * k).toFixed(3)})`);
      ig.addColorStop(1, "rgba(143,183,196,0)");
      g.fillStyle = ig;
      g.fillRect(0, 0, size.w, size.h);
    }

    // edge of the surveyed extent
    g.strokeStyle = "rgba(96,127,139,0.5)";
    g.setLineDash([4, 5]);
    g.lineWidth = 1;
    g.strokeRect(sx(0), sy(0), terrain.size * view.scale, terrain.size * view.scale);
    g.setLineDash([]);
  }, [terrain, climate, view, size]);

  const you = toScreen(terrain.size / 2, terrain.size / 2);
  const barCells = 100 / METRES_PER_CELL;

  return (
    <div className="map-inner" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className={dragging ? "dragging" : ""}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />

      <div className="map-overlay">
        <div className="you" style={{ left: you.x, top: you.y }}>
          <svg viewBox="0 0 30 30" aria-hidden="true">
            <circle cx="15" cy="15" r="9.5" fill="none" stroke="#8fb7c4" strokeWidth="1" opacity="0.55" />
            <circle cx="15" cy="15" r="3" fill="#8fb7c4" />
            <path d="M15 1 V6 M15 24 V29 M1 15 H6 M24 15 H29" stroke="#8fb7c4" strokeWidth="1" opacity="0.7" />
          </svg>
        </div>

        {spawns.map((s) => {
          const p = toScreen(s.cx, s.cy);
          if (p.x < -40 || p.x > size.w + 40 || p.y < -40 || p.y > size.h + 40) return null;
          const logged = loggedKeys.has(s.key);
          const color = logged ? "#4e575a" : TIER_COLOR[s.species.tier];
          return (
            <button
              key={s.key}
              className="mark"
              style={{ left: p.x, top: p.y, color }}
              onClick={() => onSelect(s)}
              aria-label={`${s.species.binomial}${logged ? ", already sketched" : ""}`}
            >
              {!logged && <span className="halo" />}
              <svg width="21" height="21" viewBox="0 0 16 16" fill={color} aria-hidden="true">
                <path d={SPOOR[s.species.tier]} />
              </svg>
            </button>
          );
        })}

        <div className="map-tools">
          <button className="tool" onClick={() => zoomBy(1.3)} aria-label="Zoom in" disabled={view.scale >= 14}>
            <svg width="13" height="13" viewBox="0 0 13 13" stroke="currentColor" strokeWidth="1.4">
              <path d="M6.5 1 V12 M1 6.5 H12" />
            </svg>
          </button>
          <button className="tool" onClick={() => zoomBy(1 / 1.3)} aria-label="Zoom out" disabled={view.scale <= 1.1}>
            <svg width="13" height="13" viewBox="0 0 13 13" stroke="currentColor" strokeWidth="1.4">
              <path d="M1 6.5 H12" />
            </svg>
          </button>
          <button
            className="tool"
            onClick={() => setView((v) => clampView({ ...v, cx: terrain.size / 2, cy: terrain.size / 2 }))}
            aria-label="Recentre on survey position"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.3" fill="none">
              <circle cx="7" cy="7" r="4" />
              <path d="M7 0 V2.5 M7 11.5 V14 M0 7 H2.5 M11.5 7 H14" />
            </svg>
          </button>
        </div>

        <div className="scalebar">
          <span>100 m</span>
          <div className="bar" style={{ width: Math.round(barCells * view.scale) }} />
        </div>
      </div>
    </div>
  );
}
