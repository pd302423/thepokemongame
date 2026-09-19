# Deep Field Survey — prototype

A location-based collecting game set in the Pleistocene. You stand where you
actually stand; the app shows what lived there, and you sketch it.

Live prototype: `prototype/index.html`

## What this prototype proves

| Piece | Status |
|---|---|
| Sediment-core time scrubber (2.58 Ma → 11.7 ka) | working |
| Climate model driving map, palette and spawn pool | working, schematic |
| Procedural terrain: contours, rivers, vegetation | working |
| Tier-weighted spawns (Found here / This formation / This world) | working |
| Scribble engine — silhouette from bones, seeded zigzag hatch | working |
| Progressive stroke-by-stroke sketch reveal | working |
| Naming, provenance stamping, Field Journal | working |
| Persistence | localStorage only |

## Core loop

    GPS position
      → time scrubber sets an age
      → climate model sets the world
      → tier-weighted spawn table from the fauna of that place and age
      → tap a trace → encounter → Sketch it
      → seeded scribble draws itself → name it
      → entry in the Field Journal, stamped with place, formation and age

## Deliberate decisions

- **Pleistocene first, not Cretaceous.** Continents are already in their modern
  positions, so no plate reconstruction is needed; the fossil record is dense
  almost everywhere; and humans coexisted with the fauna.
- **No 3D.** The drawing is the artifact. A 3D pipeline would be a second art
  production line serving the same moment.
- **Art is generated from a seed, not fetched.** Every sketch is deterministic
  per individual: same seed, same drawing, forever. Zero runtime cost, works
  offline, and the set stays visually coherent — which per-request generation
  cannot guarantee.
- **Single-theme dark by choice.** This is a field instrument used outdoors at
  dusk. Every colour is painted explicitly.

## Data honesty

The prototype ships a curated sample of 10 taxa from Upper Siwalik (Pinjor Fm.)
and Narmada records. Ages, formations and faunal associations are real to within
the precision shown. The climate curve is schematic — the right *shape*
(41 kyr obliquity pacing before the mid-Pleistocene transition, 100 kyr after)
rather than a reconstruction.

A shipping build would read occurrences from the Paleobiology Database and
weight them by the three tiers above.

## Not built yet

Real GPS, real map tiles, PBDB integration, AR compositing, accounts, the other
50–70 species, walking mechanics, sharing.
