import { rngFrom } from "./rng";
import { SPECIES, TIER_WEIGHT, type Species } from "./species";
import { SURVEY_CELLS } from "./terrain";

export interface Spawn {
  key: string;
  species: Species;
  seed: string;
  /** Position in survey cell coordinates. */
  cx: number;
  cy: number;
}

export function availableAt(ka: number): Species[] {
  return SPECIES.filter((s) => ka <= s.from && ka >= s.to);
}

/** Tier-weighted spawning.
 *
 *  Weight is the whole honesty mechanic: a taxon with confirmed local
 *  occurrences appears five times as often as one that merely shared the
 *  continent, and the player is told which is which. */
export function rollSpawns(ka: number, terrainHeight: Float32Array, minH: number, maxH: number): Spawn[] {
  const bucket = Math.round(ka / 25);
  const rng = rngFrom(`spawns|${bucket}`);
  const pool = availableAt(ka);
  if (!pool.length) return [];

  const weighted: Species[] = [];
  for (const s of pool) for (let i = 0; i < TIER_WEIGHT[s.tier]; i++) weighted.push(s);

  const n = 5 + Math.floor(rng() * 4);
  const out: Spawn[] = [];
  const used = new Set<string>();
  let guard = 0;

  while (out.length < n && guard++ < 200) {
    const sp = weighted[Math.floor(rng() * weighted.length)];
    if (used.has(sp.id) && rng() > 0.3) continue;

    // Place on ground that suits the animal: the hippo and the crocodile
    // belong in the valley floors, the hyena and the giraffid on higher,
    // drier ground. A spawn table that ignores terrain wastes the terrain.
    const wantsLow = sp.id.includes("hexaprotodon") || sp.id.includes("crocodylus");
    const wantsHigh = sp.id.includes("pachycrocuta") || sp.id.includes("sivatherium");

    let cx = 0;
    let cy = 0;
    let bestScore = -Infinity;
    for (let attempt = 0; attempt < 14; attempt++) {
      const tx = 30 + rng() * (SURVEY_CELLS - 60);
      const ty = 30 + rng() * (SURVEY_CELLS - 60);
      const e = (terrainHeight[Math.floor(ty) * SURVEY_CELLS + Math.floor(tx)] - minH) / (maxH - minH || 1);
      const score = wantsLow ? 1 - e : wantsHigh ? e : 1 - Math.abs(e - 0.5) * 2;
      if (score > bestScore) {
        bestScore = score;
        cx = tx;
        cy = ty;
      }
    }

    used.add(sp.id);
    out.push({
      key: `${bucket}-${out.length}-${sp.id}`,
      species: sp,
      seed: `${sp.id}|${bucket}|${out.length}|${Math.floor(rng() * 99999)}`,
      cx,
      cy
    });
  }
  return out;
}
