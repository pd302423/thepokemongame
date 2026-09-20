/** Seeded randomness. Everything generated in this app is deterministic:
 *  the same seed always produces the same terrain, the same individual,
 *  the same drawing — which is what lets the world feel like a place. */

export function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Rng = () => number;

export function rngFrom(seed: string | number): Rng {
  let a = (typeof seed === "string" ? hashStr(seed) : seed >>> 0) || 1;
  return () => {
    a ^= a << 13;
    a >>>= 0;
    a ^= a >> 17;
    a ^= a << 5;
    a >>>= 0;
    return a / 4294967296;
  };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length) % arr.length];
