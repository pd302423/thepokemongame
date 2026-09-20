# Deep Field Survey — React prototype

    npm install
    npm run dev

## Why it is laid out this way

`src/engine/` is **pure TypeScript with zero framework imports**. That is
deliberate: it is the expensive part, and it must move to React Native
unchanged when this goes mobile. The React layer is a thin shell over it.

    engine/
      rng.ts        seeded PRNG — everything generated is deterministic
      noise.ts      value noise + fBm + ridged
      facies.ts     depositional environments, declared as data
      erosion.ts    droplet hydraulic erosion, D8 flow accumulation, channel tracing
      terrain.ts    orchestration; incremental so the UI can show progress
      contours.ts   marching squares, extracted once in survey space
      climate.ts    glacial/interglacial pacing, Siwalik lithostratigraphy
      species.ts    ten taxa, silhouettes as bone skeletons
      spawns.ts     tier-weighted spawning, terrain-aware placement
      scribble.ts   the art engine

## The terrain pipeline

    noise surface, parameterised by depositional facies
      → droplet hydraulic erosion
      → D8 flow accumulation
      → channels traced downstream, width from local accumulation
      → marching-squares contours
      → vegetation gated by elevation band and climate

Erosion is the step that matters. Noise has no memory of water; real
landscapes are carved by it, which is why eroded surfaces grow convergent
valleys and dendritic drainage that octave-stacking never produces.

### Dropping in a real DEM

`baseSurface()` in `terrain.ts` takes an optional `base: Float32Array`.
Load a Copernicus GLO-30 tile for the player's coordinates, resample to the
survey grid, pass it in. Nothing downstream changes. The regional structure
of a place is genuinely inherited across this timespan — it is the surface
that differs, not the skeleton.

### Adding a depositional setting

Add an entry to `FACIES` in `facies.ts`. No generator code changes. This is
the structural idea borrowed from Terra (the Minecraft worldgen framework):
terrain is configured, not coded, so a geologist could author one.

## The scribble engine

A silhouette is built by unioning tapered capsules along a bone skeleton,
then filled with seeded zigzag hatching clipped to that union. Only eyes,
tusks and horns are hand-authored paths.

- A new species costs ~15 lines of coordinates, not a drawing.
- Every individual differs — coat, hatch angle, density, build, age class —
  but is fully deterministic from its seed.
- Zero runtime cost, works offline, and no style drift between animals,
  which per-request image generation cannot guarantee.

## Data honesty

Ten taxa curated from Upper Siwalik (Pinjor Fm.) and Narmada records. Ages,
formations and faunal associations are real to the precision shown. The
climate curve is schematic — the right shape (41 kyr obliquity pacing before
the mid-Pleistocene transition, 100 kyr after), not a reconstruction; real
work would drive it from a benthic δ18O stack. Terrain is generated, not
measured, and the UI says so.

## Not built

Real GPS, real DEM ingestion, PBDB integration, MapLibre viewport, accounts,
AR, walking mechanics, the other 50–70 species. Spawns regenerate on scrub,
which is a prototype convenience and would be an exploit in a real build.
