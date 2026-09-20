/** Depositional environments, declared as data rather than code.
 *
 *  This is the structural idea borrowed from Terra (the Minecraft worldgen
 *  framework): terrain is *configured*, not hard-coded. A geologist could
 *  author a new entry here without touching the generator — which is what
 *  makes adding a region or a formation a data task instead of an
 *  engineering one.
 *
 *  Values are chosen to produce the right *character* of landscape described
 *  by the literature for each setting. They are not measurements. */

export interface Facies {
  id: string;
  label: string;
  /** Short description of the real depositional setting. */
  setting: string;
  /** Vertical relief across the survey extent, in metres. */
  relief: number;
  /** Regional slope. Fans are steep; floodplains are nearly flat. */
  gradient: number;
  /** Base-noise octaves — more detail in coarse, proximal settings. */
  octaves: number;
  /** 0 = smooth fBm, 1 = fully ridged. Fans sharpen toward the mountain front. */
  ridging: number;
  /** Spatial frequency of the base surface. Higher = finer-grained landscape. */
  frequency: number;
  erosion: {
    /** Droplets per 1000 cells. More = more deeply carved. */
    intensity: number;
    /** Directional persistence. Low inertia braids; high inertia incises. */
    inertia: number;
    /** How much sediment a droplet can carry. */
    capacity: number;
    erodeSpeed: number;
    depositSpeed: number;
    evaporate: number;
  };
  /** Flow accumulation (in upstream cells) above which a cell counts as a
   *  channel. Lower values braid; higher ones leave a single trunk. */
  channelThreshold: number;
  vegetation: { min: number; max: number; density: number };
}

export const FACIES: Record<string, Facies> = {
  "braided-floodplain": {
    id: "braided-floodplain",
    label: "Braided floodplain",
    setting:
      "Sand-dominated braided rivers on a low-gradient plain, shifting channels across a wide belt. The Pinjor Formation is deposited in this setting.",
    relief: 34,
    gradient: 0.0011,
    octaves: 5,
    ridging: 0.1,
    frequency: 2.6,
    erosion: { intensity: 320, inertia: 0.02, capacity: 3.4, erodeSpeed: 0.28, depositSpeed: 0.24, evaporate: 0.014 },
    channelThreshold: 620,
    vegetation: { min: 0.3, max: 0.72, density: 1.0 }
  },
  "alluvial-fan": {
    id: "alluvial-fan",
    label: "Alluvial fan",
    setting:
      "Coarse debris shed off a rising mountain front, steep and poorly sorted. The Boulder Conglomerate records this as the Himalaya accelerates.",
    relief: 96,
    gradient: 0.0085,
    octaves: 6,
    ridging: 0.62,
    frequency: 3.4,
    erosion: { intensity: 200, inertia: 0.1, capacity: 4.6, erodeSpeed: 0.4, depositSpeed: 0.12, evaporate: 0.02 },
    channelThreshold: 900,
    vegetation: { min: 0.22, max: 0.55, density: 0.45 }
  },
  "meandering-floodplain": {
    id: "meandering-floodplain",
    label: "Meandering floodplain",
    setting:
      "A single sinuous channel on a muddy, well-vegetated plain, with oxbows and levees. Wetter intervals of the Siwalik sequence look like this.",
    relief: 18,
    gradient: 0.0006,
    octaves: 4,
    ridging: 0.04,
    frequency: 1.9,
    erosion: { intensity: 380, inertia: 0.24, capacity: 2.6, erodeSpeed: 0.2, depositSpeed: 0.34, evaporate: 0.009 },
    channelThreshold: 1500,
    vegetation: { min: 0.26, max: 0.78, density: 1.35 }
  },
  "incised-terrace": {
    id: "incised-terrace",
    label: "Incised terrace",
    setting:
      "Rivers cutting down into their own older deposits, leaving stepped terraces. This is the modern Ghaggar setting, and it post-dates the fauna.",
    relief: 58,
    gradient: 0.0024,
    octaves: 5,
    ridging: 0.3,
    frequency: 2.4,
    erosion: { intensity: 460, inertia: 0.35, capacity: 4.0, erodeSpeed: 0.44, depositSpeed: 0.1, evaporate: 0.012 },
    channelThreshold: 1150,
    vegetation: { min: 0.3, max: 0.7, density: 0.85 }
  }
};

/** Which setting this place was in, at this age. Real transitions:
 *  Pinjor braided floodplain gives way to Boulder Conglomerate fans as the
 *  range rises, and the modern landscape is incised into all of it. */
export function faciesAt(ka: number): Facies {
  if (ka > 2400) return FACIES["meandering-floodplain"];
  if (ka > 600) return FACIES["braided-floodplain"];
  if (ka > 200) return FACIES["alluvial-fan"];
  return FACIES["incised-terrace"];
}
