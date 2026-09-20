import { useCallback, useEffect, useState } from "react";
import type { Tier } from "./engine/species";

export interface Sighting {
  id: string;
  spawnKey: string;
  speciesId: string;
  seed: string;
  given: string;
  ka: number;
  place: string;
  lat: number;
  lng: number;
  formation: string;
  facies: string;
  tier: Tier;
  at: number;
}

const KEY = "deepfield.sightings.v2";

/** localStorage is per-viewer and can be unavailable (private windows,
 *  blocked site data), so every access is guarded and the app renders
 *  correctly with nothing stored. */
function load(): Sighting[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Sighting[]) : [];
  } catch {
    return [];
  }
}

export function useSightings() {
  const [sightings, setSightings] = useState<Sighting[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(sightings));
    } catch {
      /* session-only; nothing to recover */
    }
  }, [sightings]);

  const add = useCallback((s: Sighting) => setSightings((prev) => [s, ...prev]), []);
  const remove = useCallback((id: string) => setSightings((prev) => prev.filter((s) => s.id !== id)), []);

  return { sightings, add, remove };
}
