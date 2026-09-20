import { lerp, clamp } from "./rng";

export const KA_MAX = 2580;
export const KA_MIN = 11.7;

export interface Climate {
  warmth: number;
  temp: number;
  monsoon: number;
  label: string;
  state: "glacial" | "transitional" | "interglacial";
}

/** Schematic glacial/interglacial cycling.
 *
 *  This is the right *shape*, not a reconstruction: obliquity-paced 41 kyr
 *  cycles before the mid-Pleistocene transition around 1 Ma, longer and
 *  more asymmetric 100 kyr cycles after it. Real work would drive this from
 *  a benthic δ18O stack (LR04). */
export function climateAt(ka: number): Climate {
  const period = ka > 1000 ? 41 : 100;
  const phase = (ka / period) * Math.PI * 2;
  let v = Math.sin(phase) * 0.5 + 0.5;
  v = ka > 1000 ? lerp(0.3, 0.7, v) : Math.pow(v, 1.5);
  v = clamp(v * 0.88 + Math.sin(ka / 13) * 0.06 + 0.06, 0, 1);

  const state = v < 0.34 ? "glacial" : v < 0.62 ? "transitional" : "interglacial";
  return {
    warmth: v,
    temp: lerp(15.2, 24.6, v),
    monsoon: Math.round(lerp(48, 108, v)),
    state,
    label:
      state === "glacial"
        ? "Glacial — cool, arid"
        : state === "transitional"
          ? "Transitional — strongly seasonal"
          : "Interglacial — warm, wet"
  };
}

export interface Formation {
  name: string;
  from: number;
  to: number;
  bands: string[];
}

/** Upper Siwalik lithostratigraphy of the Chandigarh–Pinjore sector.
 *  The Pinjor Formation takes its name from Pinjore, about 20 km from the
 *  survey position, and is the type section for its fauna. */
export const FORMATIONS: Formation[] = [
  { name: "Tatrot", from: 2580, to: 2400, bands: ["#7A6A52", "#6B5B45", "#83735A"] },
  { name: "Pinjor", from: 2400, to: 600, bands: ["#8A7A5E", "#7E6E54", "#95856A", "#73634C"] },
  { name: "Boulder Conglomerate", from: 600, to: 200, bands: ["#5F5A52", "#6E6860", "#4F4A44"] },
  { name: "Post-Siwalik alluvium", from: 200, to: 11.7, bands: ["#6A6152", "#756C5C", "#5E5648"] }
];

export function formationAt(ka: number): Formation {
  for (const f of FORMATIONS) if (ka <= f.from && ka > f.to) return f;
  return FORMATIONS[FORMATIONS.length - 1];
}

export const kaToT = (ka: number) => (KA_MAX - ka) / (KA_MAX - KA_MIN);
export const tToKa = (t: number) => KA_MAX - t * (KA_MAX - KA_MIN);

export function formatAge(ka: number): string {
  return ka >= 1000 ? `${(ka / 1000).toFixed(2)} Ma` : `${Math.round(ka)} ka`;
}
