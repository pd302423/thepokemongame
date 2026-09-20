import { rngFrom, lerp } from "./rng";
import { makeNoise, fbm, ridged } from "./noise";
import { erodeBatch, flowAccumulation, traceChannels, DEFAULT_EROSION } from "./erosion";
import { extractContours, type ContourLevel } from "./contours";
import type { Facies } from "./facies";

export const SURVEY_CELLS = 320;
export const METRES_PER_CELL = 9;
export const SURVEY_METRES = SURVEY_CELLS * METRES_PER_CELL;

export interface VegPoint {
  x: number;
  y: number;
  e: number;
  s: number;
}

export interface Terrain {
  size: number;
  metresPerCell: number;
  height: Float32Array;
  minH: number;
  maxH: number;
  contours: ContourLevel[];
  channels: number[][][];
  vegetation: VegPoint[];
  facies: Facies;
}

/** Base surface before water touches it.
 *
 *  In a shipping build this is where a real DEM goes: load a Copernicus
 *  GLO-30 tile for the player's coordinates, resample to the survey grid,
 *  and hand it in instead of generating one. Everything downstream —
 *  erosion, channels, contours — is unchanged. The regional structure of
 *  a place is genuinely inherited across this timespan; it is the surface
 *  that differs, not the skeleton. */
function baseSurface(seed: string, f: Facies, base?: Float32Array): Float32Array {
  const size = SURVEY_CELLS;
  const h = new Float32Array(size * size);
  if (base && base.length === h.length) {
    h.set(base);
    return h;
  }

  const noise = makeNoise(seed + "|surface");
  const warp = makeNoise(seed + "|warp");

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * f.frequency;
      const v = (y / size) * f.frequency;
      // Domain warping breaks the grid-aligned look that plain fBm has.
      const wx = u + (fbm(warp, u * 1.7, v * 1.7, 3) - 0.5) * 0.85;
      const wy = v + (fbm(warp, u * 1.7 + 41, v * 1.7 + 17, 3) - 0.5) * 0.85;

      const smooth = fbm(noise, wx, wy, f.octaves);
      const sharp = ridged(noise, wx, wy, f.octaves);
      const mixed = lerp(smooth, sharp, f.ridging);

      // Regional slope: the land falls away from the mountain front.
      const regional = (1 - y / size) * f.gradient * SURVEY_METRES;
      h[y * size + x] = mixed * f.relief + regional;
    }
  }
  return h;
}

/** Incremental terrain build. Stepping it in batches keeps the main thread
 *  responsive and lets the UI show real progress instead of a frozen frame. */
export class TerrainBuilder {
  readonly size = SURVEY_CELLS;
  private h: Float32Array;
  private rng: ReturnType<typeof rngFrom>;
  private done = 0;
  private target: number;
  private facies: Facies;

  constructor(seed: string, facies: Facies, base?: Float32Array) {
    this.facies = facies;
    this.h = baseSurface(seed, facies, base);
    this.rng = rngFrom(seed + "|erode");
    this.target = Math.round((facies.erosion.intensity * this.size * this.size) / 1000);
  }

  /** Returns progress 0..1. */
  step(batch = 2500): number {
    const n = Math.min(batch, this.target - this.done);
    if (n > 0) {
      erodeBatch(this.h, this.size, n, { ...DEFAULT_EROSION, ...this.facies.erosion }, this.rng);
      this.done += n;
    }
    return this.target === 0 ? 1 : this.done / this.target;
  }

  finish(seed: string): Terrain {
    const size = this.size;
    const h = this.h;

    let minH = Infinity;
    let maxH = -Infinity;
    for (let i = 0; i < h.length; i++) {
      if (h[i] < minH) minH = h[i];
      if (h[i] > maxH) maxH = h[i];
    }

    const acc = flowAccumulation(h, size);
    const channels = traceChannels(h, acc, size, this.facies.channelThreshold);
    const contours = extractContours(h, size, minH, maxH, 22, 2);

    // Vegetation candidates, sampled once. Which ones actually render is
    // decided at draw time by the climate, so scrubbing time is instant.
    const vr = rngFrom(seed + "|veg");
    const vegetation: VegPoint[] = [];
    const vegCount = Math.round(size * size * 0.09);
    for (let i = 0; i < vegCount; i++) {
      const x = vr() * (size - 1);
      const y = vr() * (size - 1);
      const e = (h[Math.floor(y) * size + Math.floor(x)] - minH) / (maxH - minH || 1);
      vegetation.push({ x, y, e, s: 0.55 + vr() * 0.9 });
    }

    return {
      size,
      metresPerCell: METRES_PER_CELL,
      height: h,
      minH,
      maxH,
      contours,
      channels,
      vegetation,
      facies: this.facies
    };
  }
}
