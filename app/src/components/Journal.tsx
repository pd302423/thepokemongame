import SketchPlate from "./SketchPlate";
import { SPECIES, SPECIES_BY_ID, TIER_LABEL } from "../engine/species";
import { formatAge } from "../engine/climate";
import { traitsFor } from "../engine/scribble";
import type { Sighting } from "../store";

export function JournalGrid({
  sightings,
  onOpen
}: {
  sightings: Sighting[];
  onOpen: (s: Sighting) => void;
}) {
  if (!sightings.length) {
    return (
      <div className="empty">
        <div className="fig">
          <svg width="62" height="44" viewBox="0 0 64 46" fill="none" stroke="#22282a" strokeWidth="1.1">
            <path d="M4 42 h56 M10 42 V14 l10-8 10 8 v28 M34 42 V20 l10-6 10 6 v22" />
          </svg>
        </div>
        <h3>Nothing recorded yet</h3>
        <p>
          Scrub the core to a depth, find a trace on the map, and sketch what you see. Every entry keeps where you
          stood and how deep in time you were standing.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="j-grid">
        {sightings.map((s) => {
          const sp = SPECIES_BY_ID[s.speciesId];
          if (!sp) return null;
          return (
            <button key={s.id} className="card" onClick={() => onOpen(s)}>
              <span className="thumb">
                <SketchPlate species={sp} seed={s.seed} thumb />
              </span>
              <span className="given">{s.given}</span>
              <span className="sp">{sp.binomial}</span>
              <span className="meta">
                <span className="dot" data-t={s.tier} />
                {formatAge(s.ka)} · {s.formation}
              </span>
            </button>
          );
        })}
      </div>
      <div className="cite">
        Prototype · {SPECIES.length} taxa curated from Upper Siwalik and Narmada records. A shipping build reads
        occurrences from the Paleobiology Database.
      </div>
    </>
  );
}

export function EntryView({ sighting }: { sighting: Sighting }) {
  const sp = SPECIES_BY_ID[sighting.speciesId];
  if (!sp) return null;
  const t = traitsFor(sp, sighting.seed);
  const d = new Date(sighting.at);

  return (
    <>
      <span className="tier" data-t={sighting.tier}>
        {TIER_LABEL[sighting.tier]}
      </span>
      <h3 className="binomial plain">{sighting.given}</h3>
      <div className="common">
        <em style={{ fontFamily: "var(--serif)" }}>{sp.binomial}</em> · {sp.common}
      </div>

      <div className="plate">
        <SketchPlate species={sp} seed={sighting.seed} />
        <div className="plate-cap">
          <span>{sighting.place}</span>
          <span>{formatAge(sighting.ka)}</span>
        </div>
      </div>

      <div className="traits">
        <span className="trait">{t.ageClass}</span>
        <span className="trait">{t.build}</span>
        <span className="trait">{t.coatWord}</span>
        {t.scarred && <span className="trait">old flank scar</span>}
      </div>

      <div className="provenance">
        <b>{sighting.place}</b>
        <br />
        {sighting.lat.toFixed(4)}° N · {sighting.lng.toFixed(4)}° E
        <br />
        {sighting.formation} · {sighting.facies}
        <br />
        Sketched {d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
      </div>

      <p className="note" style={{ marginTop: 16 }}>
        {sp.note}
      </p>
    </>
  );
}
