import { rngFrom } from "./rng";

/** Value noise with smooth interpolation, plus fractal Brownian motion.
 *  This is only the *base* surface — on its own it reads as noise, not
 *  landscape. Erosion is what turns it into terrain. */

export function makeNoise(seed: string) {
  const N = 256;
  const g = new Float32Array(N * N);
  const r = rngFrom(seed);
  for (let i = 0; i < g.length; i++) g[i] = r();

  const at = (x: number, y: number) => g[((y & (N - 1)) << 8) | (x & (N - 1))];
  const smooth = (t: number) => t * t * (3 - 2 * t);

  return function noise(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = smooth(x - xi);
    const yf = smooth(y - yi);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}

export function fbm(
  noise: (x: number, y: number) => number,
  x: number,
  y: number,
  octaves: number,
  lacunarity = 2.03,
  gain = 0.5
): number {
  let v = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    v += noise(x * freq, y * freq) * amp;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return v / norm;
}

/** Ridged noise — sharpens divides, which alluvial-fan settings want. */
export function ridged(
  noise: (x: number, y: number) => number,
  x: number,
  y: number,
  octaves: number
): number {
  let v = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const n = 1 - Math.abs(noise(x * freq, y * freq) * 2 - 1);
    v += n * n * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return v / norm;
}
