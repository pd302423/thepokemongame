import { rngFrom, pick, lerp, hashStr, type Rng } from "./rng";
import type { Species } from "./species";

/** The scribble engine.
 *
 *  A silhouette is built by unioning tapered capsules along a bone skeleton,
 *  then filled with zigzag hatching clipped to that union. Only the eyes,
 *  tusks and horns are hand-authored paths.
 *
 *  Consequences that matter: a new species costs fifteen lines of
 *  coordinates rather than a drawing; every individual is different but
 *  fully deterministic from its seed; and the whole thing runs for free on
 *  device, offline, with no style drift between one animal and the next. */

export interface Circle {
  cx: number;
  cy: number;
  r: number;
}

export interface Stroke {
  d: string;
  len: number;
  w: number;
  color: string;
  opacity: number;
  clipped: boolean;
  fill: boolean;
  order: number;
}

export interface Traits {
  coat: string;
  coatWord: string;
  build: string;
  ageClass: string;
  scarred: boolean;
}

export interface Scribble {
  clip: Circle[];
  strokes: Stroke[];
  total: number;
  traits: Traits;
  clipId: string;
}

const COAT_WORDS = ["dark-flanked", "pale-shouldered", "rust-backed", "ash-grey", "dun", "umber", "smoke-grey", "tawny"];
const BUILD_WORDS = ["heavy-built", "lean", "broad-chested", "long-limbed", "stocky", "rangy"];
const AGE_WORDS = ["juvenile", "young adult", "prime adult", "old adult", "aged"];

export function traitsFor(sp: Species, seed: string): Traits {
  const rng = rngFrom(seed + "|traits");
  return {
    coat: sp.coats[Math.floor(rng() * sp.coats.length)],
    coatWord: pick(rng, COAT_WORDS),
    build: pick(rng, BUILD_WORDS),
    ageClass: pick(rng, AGE_WORDS),
    scarred: rng() < 0.22
  };
}

function bbox(sp: Species) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const b of sp.bones) {
    x0 = Math.min(x0, b.a[0] - b.ra, b.b[0] - b.rb);
    x1 = Math.max(x1, b.a[0] + b.ra, b.b[0] + b.rb);
    y0 = Math.min(y0, b.a[1] - b.ra, b.b[1] - b.rb);
    y1 = Math.max(y1, b.a[1] + b.ra, b.b[1] + b.rb);
  }
  return { x0, y0, x1, y1 };
}

function clipCircles(sp: Species): Circle[] {
  const out: Circle[] = [];
  for (const b of sp.bones) {
    const dx = b.b[0] - b.a[0];
    const dy = b.b[1] - b.a[1];
    const n = Math.max(3, Math.ceil(Math.hypot(dx, dy) / 2.6));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push({ cx: b.a[0] + dx * t, cy: b.a[1] + dy * t, r: lerp(b.ra, b.rb, t) });
    }
  }
  return out;
}

type Pt = [number, number];

interface ZigCfg {
  zig: number;
  amp: number;
  jit: number;
}

function zigzag(bb: ReturnType<typeof bbox>, angle: number, off: number, rng: Rng, cfg: ZigCfg): Pt[] {
  const cx = (bb.x0 + bb.x1) / 2;
  const cy = (bb.y0 + bb.y1) / 2;
  const diag = Math.hypot(bb.x1 - bb.x0, bb.y1 - bb.y0) / 2 + 6;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const ox = cx + px * off;
  const oy = cy + py * off;

  const pts: Pt[] = [];
  let s = -diag;
  let k = 0;
  while (s <= diag) {
    const a = (k % 2 === 0 ? cfg.amp : -cfg.amp) + (rng() - 0.5) * cfg.jit;
    pts.push([ox + ux * s + px * a, oy + uy * s + py * a]);
    s += cfg.zig * (0.78 + rng() * 0.44);
    k++;
  }
  return pts;
}

const polyLen = (p: Pt[]) => {
  let L = 0;
  for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return L;
};

const polyD = (p: Pt[]) => "M" + p.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" L ");

export function makeScribble(sp: Species, seed: string, opts: { thumb?: boolean } = {}): Scribble {
  const rng = rngFrom(seed + "|art");
  const traits = traitsFor(sp, seed);
  const bb = bbox(sp);
  const strokes: Stroke[] = [];
  let order = 0;

  const angle = -0.62 + rng() * 0.5;
  const cfg: ZigCfg = { zig: 7.5 + rng() * 3.5, amp: 3.0 + rng() * 2.2, jit: 2.0 + rng() * 1.6 };
  const spacing = 2.9 + rng() * 1.3;
  const span = Math.hypot(bb.x1 - bb.x0, bb.y1 - bb.y0);

  // Main hatch. Per-stroke variation stops the fill weaving into a visible
  // lattice, which is the tell that separates a filter from a hand.
  for (let off = -span / 2; off <= span / 2; off += spacing * (0.7 + rng() * 0.75)) {
    const c: ZigCfg = { zig: cfg.zig * (0.7 + rng() * 0.75), amp: cfg.amp * (0.55 + rng() * 0.95), jit: cfg.jit };
    const pts = zigzag(bb, angle + (rng() - 0.5) * 0.26, off + (rng() - 0.5) * 1.6, rng, c);
    strokes.push({
      d: polyD(pts), len: polyLen(pts), w: 0.8 + rng() * 0.95,
      color: traits.coat, opacity: 1, clipped: true, fill: false, order: order++
    });
  }

  // Sparser cross-pass in a darker tone, for depth.
  const rng2 = rngFrom(seed + "|cross");
  for (let off = -span / 2; off <= span / 2; off += spacing * (2.2 + rng2() * 1.6)) {
    const pts = zigzag(bb, angle + 0.72 + (rng2() - 0.5) * 0.4, off, rng2, {
      zig: cfg.zig * 1.5, amp: cfg.amp * 0.9, jit: cfg.jit * 1.2
    });
    strokes.push({
      d: polyD(pts), len: polyLen(pts), w: 0.7 + rng2() * 0.7,
      color: "#3A332B", opacity: 0.42, clipped: true, fill: false, order: order++
    });
  }

  for (const m of sp.marks) {
    strokes.push({
      d: m.d, len: m.fill ? 12 : 220, w: m.w,
      color: "#141210", opacity: 1, clipped: false, fill: !!m.fill, order: order++
    });
  }

  // Ground scribble, like the grey hatching under a field sketch.
  const grng = rngFrom(seed + "|ground");
  const gCount = opts.thumb ? 4 : 6;
  for (let i = 0; i < gCount; i++) {
    const y = 125 + i * 2.2 + (grng() - 0.5) * 1.4;
    const x0 = bb.x0 + 2 + grng() * 18;
    const x1 = bb.x1 - 2 - grng() * 18;
    const pts: Pt[] = [];
    let x = x0;
    let k = 0;
    while (x < x1) {
      pts.push([x, y + (k % 2 ? 1.9 : -1.9) * (0.5 + grng()) + (grng() - 0.5)]);
      x += 9 + grng() * 9;
      k++;
    }
    if (pts.length > 1) {
      strokes.push({
        d: polyD(pts), len: polyLen(pts), w: 0.7 + grng() * 0.5,
        color: "#8F8A80", opacity: 0.75, clipped: false, fill: false, order: order++
      });
    }
  }

  return {
    clip: clipCircles(sp),
    strokes,
    total: order,
    traits,
    clipId: "clip-" + Math.abs(hashStr(seed + sp.id)).toString(36)
  };
}

const NAME_FIRST = ["Ghaggar", "Pinjore", "Dera", "Morni", "Sukhna", "Tatrot", "Kalka", "Nada", "Jhajjar", "Siswan"];
const NAME_SECOND = ["the Elder", "One-Tusk", "Broadback", "of the Shallows", "Longshadow", "the Quiet", "Redflank", "Nightwalker", "Stormflank", "the Patient"];

export function suggestName(seed: string): string {
  const rng = rngFrom(seed + "|name");
  return `${pick(rng, NAME_FIRST)} ${pick(rng, NAME_SECOND)}`;
}
