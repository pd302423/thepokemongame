import type { Rng } from "./rng";

/** Droplet-based hydraulic erosion.
 *
 *  This is the step that separates "noise that resembles terrain" from
 *  terrain. Noise has no memory of water; real landscapes are carved by it,
 *  which is why eroded surfaces grow convergent valleys, sharpened divides
 *  and dendritic drainage that no amount of octave-stacking produces.
 *
 *  Follows the standard particle formulation (cf. Mei, Decaudin & Hu 2007,
 *  and the widely-used droplet simplification of it). */

export interface ErosionParams {
  inertia: number;
  capacity: number;
  erodeSpeed: number;
  depositSpeed: number;
  evaporate: number;
  gravity: number;
  radius: number;
  maxLifetime: number;
  minSlope: number;
}

export const DEFAULT_EROSION: ErosionParams = {
  inertia: 0.05,
  capacity: 3.5,
  erodeSpeed: 0.3,
  depositSpeed: 0.3,
  evaporate: 0.013,
  gravity: 4,
  radius: 3,
  maxLifetime: 34,
  minSlope: 0.01
};

/** Precomputed deposition/erosion brush: spreading the effect over a disc
 *  instead of a single cell is what keeps the result from going spiky. */
function makeBrush(size: number, radius: number) {
  const xs: number[] = [];
  const ys: number[] = [];
  const ws: number[] = [];

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const d2 = x * x + y * y;
      if (d2 < radius * radius) {
        xs.push(x);
        ys.push(y);
        ws.push(1 - Math.sqrt(d2) / radius);
      }
    }
  }
  const total = ws.reduce((a, b) => a + b, 0);

  return function brushAt(cx: number, cy: number) {
    const idx: number[] = [];
    const w: number[] = [];
    for (let i = 0; i < xs.length; i++) {
      const px = cx + xs[i];
      const py = cy + ys[i];
      if (px < 0 || px >= size || py < 0 || py >= size) continue;
      idx.push(py * size + px);
      w.push(ws[i] / total);
    }
    return { idx, w };
  };
}

interface Gradient {
  height: number;
  gx: number;
  gy: number;
}

function heightAndGradient(h: Float32Array, size: number, px: number, py: number): Gradient {
  const cx = Math.floor(px);
  const cy = Math.floor(py);
  const fx = px - cx;
  const fy = py - cy;
  const i = cy * size + cx;
  const nw = h[i];
  const ne = h[i + 1];
  const sw = h[i + size];
  const se = h[i + size + 1];

  return {
    gx: (ne - nw) * (1 - fy) + (se - sw) * fy,
    gy: (sw - nw) * (1 - fx) + (se - ne) * fx,
    height: nw * (1 - fx) * (1 - fy) + ne * fx * (1 - fy) + sw * (1 - fx) * fy + se * fx * fy
  };
}

/** Run `count` droplets. Call repeatedly in small batches to keep the UI
 *  responsive and show honest progress rather than a frozen tab. */
export function erodeBatch(
  h: Float32Array,
  size: number,
  count: number,
  p: ErosionParams,
  rng: Rng
): void {
  const brushAt = makeBrush(size, p.radius);

  for (let drop = 0; drop < count; drop++) {
    let px = rng() * (size - 2) + 1;
    let py = rng() * (size - 2) + 1;
    let dx = 0;
    let dy = 0;
    let speed = 1;
    let water = 1;
    let sediment = 0;

    for (let life = 0; life < p.maxLifetime; life++) {
      const nx = Math.floor(px);
      const ny = Math.floor(py);
      const cellOffsetX = px - nx;
      const cellOffsetY = py - ny;

      const { height, gx, gy } = heightAndGradient(h, size, px, py);

      dx = dx * p.inertia - gx * (1 - p.inertia);
      dy = dy * p.inertia - gy * (1 - p.inertia);
      const len = Math.hypot(dx, dy);
      if (len !== 0) {
        dx /= len;
        dy /= len;
      }
      px += dx;
      py += dy;

      if ((dx === 0 && dy === 0) || px < 1 || px >= size - 2 || py < 1 || py >= size - 2) break;

      const newHeight = heightAndGradient(h, size, px, py).height;
      const deltaHeight = newHeight - height;

      const capacity = Math.max(-deltaHeight, p.minSlope) * speed * water * p.capacity;

      if (sediment > capacity || deltaHeight > 0) {
        // Uphill or over capacity: drop sediment. Uphill drops fill the pit
        // rather than overtopping it, which is how basins get flat floors.
        const amount = deltaHeight > 0 ? Math.min(deltaHeight, sediment) : (sediment - capacity) * p.depositSpeed;
        sediment -= amount;
        const i = ny * size + nx;
        h[i] += amount * (1 - cellOffsetX) * (1 - cellOffsetY);
        h[i + 1] += amount * cellOffsetX * (1 - cellOffsetY);
        h[i + size] += amount * (1 - cellOffsetX) * cellOffsetY;
        h[i + size + 1] += amount * cellOffsetX * cellOffsetY;
      } else {
        const amount = Math.min((capacity - sediment) * p.erodeSpeed, -deltaHeight);
        const { idx, w } = brushAt(nx, ny);
        for (let k = 0; k < idx.length; k++) {
          const take = Math.min(h[idx[k]], amount * w[k]);
          h[idx[k]] -= take;
          sediment += take;
        }
      }

      speed = Math.sqrt(Math.max(0, speed * speed - deltaHeight * p.gravity));
      water *= 1 - p.evaporate;
      if (water < 0.01) break;
    }
  }
}

/** D8 flow accumulation. Rivers are not drawn — they are the cells that
 *  enough water passes through, which is why they land in the valleys
 *  erosion just cut rather than wandering across ridges. */
export function flowAccumulation(h: Float32Array, size: number): Float32Array {
  const acc = new Float32Array(size * size).fill(1);
  const order = new Int32Array(size * size);
  for (let i = 0; i < order.length; i++) order[i] = i;
  // Process from high ground down, so every cell's inflow is already summed.
  const arr = Array.from(order).sort((a, b) => h[b] - h[a]);

  const DX = [-1, 0, 1, -1, 1, -1, 0, 1];
  const DY = [-1, -1, -1, 0, 0, 1, 1, 1];

  for (const i of arr) {
    const x = i % size;
    const y = (i / size) | 0;
    let bestDrop = 0;
    let best = -1;
    for (let k = 0; k < 8; k++) {
      const px = x + DX[k];
      const py = y + DY[k];
      if (px < 0 || px >= size || py < 0 || py >= size) continue;
      const j = py * size + px;
      const dist = DX[k] !== 0 && DY[k] !== 0 ? Math.SQRT2 : 1;
      const drop = (h[i] - h[j]) / dist;
      if (drop > bestDrop) {
        bestDrop = drop;
        best = j;
      }
    }
    if (best >= 0) acc[best] += acc[i];
  }
  return acc;
}

/** Trace channel polylines downstream from every headwater cell. */
export function traceChannels(
  h: Float32Array,
  acc: Float32Array,
  size: number,
  threshold: number
): number[][][] {
  const DX = [-1, 0, 1, -1, 1, -1, 0, 1];
  const DY = [-1, -1, -1, 0, 0, 1, 1, 1];
  const visited = new Uint8Array(size * size);
  const lines: number[][][] = [];

  const downstream = (i: number): number => {
    const x = i % size;
    const y = (i / size) | 0;
    let bestDrop = 0;
    let best = -1;
    for (let k = 0; k < 8; k++) {
      const px = x + DX[k];
      const py = y + DY[k];
      if (px < 0 || px >= size || py < 0 || py >= size) continue;
      const j = py * size + px;
      const dist = DX[k] !== 0 && DY[k] !== 0 ? Math.SQRT2 : 1;
      const drop = (h[i] - h[j]) / dist;
      if (drop > bestDrop) {
        bestDrop = drop;
        best = j;
      }
    }
    return best;
  };

  for (let i = 0; i < acc.length; i++) {
    if (acc[i] < threshold || visited[i]) continue;
    // Headwater: no upstream neighbour already above threshold.
    const x = i % size;
    const y = (i / size) | 0;
    let isSource = true;
    for (let k = 0; k < 8 && isSource; k++) {
      const px = x + DX[k];
      const py = y + DY[k];
      if (px < 0 || px >= size || py < 0 || py >= size) continue;
      const j = py * size + px;
      if (acc[j] >= threshold && downstream(j) === i) isSource = false;
    }
    if (!isSource) continue;

    const line: number[][] = [];
    let cur = i;
    for (let step = 0; step < size * 2; step++) {
      visited[cur] = 1;
      line.push([cur % size, (cur / size) | 0, acc[cur]]);
      const next = downstream(cur);
      if (next < 0 || acc[next] < threshold) break;
      if (visited[next]) {
        line.push([next % size, (next / size) | 0, acc[next]]);
        break;
      }
      cur = next;
    }
    if (line.length > 3) lines.push(line);
  }
  return lines;
}
