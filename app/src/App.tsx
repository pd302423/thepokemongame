import { useEffect, useMemo, useRef, useState } from "react";
import MapView from "./components/MapView";
import CoreScrubber from "./components/CoreScrubber";
import Panel from "./components/Panel";
import { EncounterView, SketchView } from "./components/Encounter";
import { JournalGrid, EntryView } from "./components/Journal";
import { TerrainBuilder, type Terrain, SURVEY_METRES } from "./engine/terrain";
import { faciesAt, FACIES } from "./engine/facies";
import { climateAt, formationAt, formatAge } from "./engine/climate";
import { rollSpawns, type Spawn } from "./engine/spawns";
import { SPECIES } from "./engine/species";
import { useSightings, type Sighting } from "./store";

const SITE = {
  place: "Ghaggar terrace, Dera Bassi",
  lat: 30.5869,
  lng: 76.842,
  elevation: 287,
  seed: "ghaggar-terrace-30.5869-76.8420"
};

type PanelState =
  | { kind: "encounter"; spawn: Spawn }
  | { kind: "sketch"; spawn: Spawn }
  | { kind: "journal" }
  | { kind: "entry"; sighting: Sighting }
  | null;

/** Terrain is rebuilt only when the depositional setting changes, not on
 *  every scrub — so moving within the Pinjor Formation is instant, and
 *  crossing into the Boulder Conglomerate visibly remakes the landscape. */
function useTerrain(faciesId: string) {
  const [terrain, setTerrain] = useState<Terrain | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const seed = `${SITE.seed}|${faciesId}`;
    setTerrain(null);
    setProgress(0);

    const builder = new TerrainBuilder(seed, FACIES[faciesId]);
    const tick = () => {
      if (cancelled) return;
      const p = builder.step(2600);
      setProgress(p);
      if (p >= 1) setTerrain(builder.finish(seed));
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    return () => {
      cancelled = true;
    };
  }, [faciesId]);

  return { terrain, progress };
}

export default function App() {
  const [ka, setKa] = useState(1240);
  const [panel, setPanel] = useState<PanelState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const { sightings, add } = useSightings();
  const facies = useMemo(() => faciesAt(ka), [ka]);
  const { terrain, progress } = useTerrain(facies.id);
  const climate = useMemo(() => climateAt(ka), [ka]);
  const formation = useMemo(() => formationAt(ka), [ka]);

  const spawns = useMemo(
    () => (terrain ? rollSpawns(ka, terrain.height, terrain.minH, terrain.maxH) : []),
    [ka, terrain]
  );
  const loggedKeys = useMemo(() => new Set(sightings.map((s) => s.spawnKey)), [sightings]);

  const say = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ctx = {
    place: SITE.place,
    lat: SITE.lat,
    lng: SITE.lng,
    ka,
    formation: formation.name,
    facies: facies.label,
    climate: climate.label
  };

  const speciesSeen = new Set(sightings.map((s) => s.speciesId)).size;
  const swatch = climate.state === "glacial" ? "#8fb7c4" : climate.state === "transitional" ? "#7e9aa6" : "#6e8f4a";

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand block-compact">
          <h1>Deep Field</h1>
          <span className="tag">Pleistocene survey</span>
        </div>

        <div className="block">
          <div className="label">Survey position</div>
          <div className="place-name">{SITE.place}</div>
          <div className="place-coords">
            {SITE.lat.toFixed(4)}° N · {SITE.lng.toFixed(4)}° E · {SITE.elevation} m
          </div>
        </div>

        <div className="block">
          <div className="label">Conditions</div>
          <div className="climate-pill">
            <span className="sw" style={{ background: swatch }} />
            {climate.label}
          </div>
          <dl style={{ margin: 0 }}>
            <div className="stat-row">
              <dt>Mean annual</dt>
              <dd>{climate.temp.toFixed(1)} °C</dd>
            </div>
            <div className="stat-row">
              <dt>Monsoon</dt>
              <dd>{climate.monsoon}% of today</dd>
            </div>
            <div className="stat-row">
              <dt>Extent</dt>
              <dd>{(SURVEY_METRES / 1000).toFixed(1)} km</dd>
            </div>
            <div className="stat-row">
              <dt>Taxa present</dt>
              <dd>
                {SPECIES.filter((s) => ka <= s.from && ka >= s.to).length} of {SPECIES.length}
              </dd>
            </div>
          </dl>
        </div>

        <div className="facies-card">
          <div className="label">Depositional setting</div>
          <div className="nm">{facies.label}</div>
          <p>{facies.setting}</p>
        </div>

        <div className="block">
          <div className="label">Trace confidence</div>
          <div className="legend">
            <div className="legend-row">
              <span className="key">
                <span className="dot" data-t="here" />
              </span>
              <span>
                <b>Found here</b> — within 50 km
              </span>
            </div>
            <div className="legend-row">
              <span className="key">
                <span className="dot" data-t="formation" />
              </span>
              <span>
                <b>This formation</b> — same beds
              </span>
            </div>
            <div className="legend-row">
              <span className="key">
                <span className="dot" data-t="world" />
              </span>
              <span>
                <b>This world</b> — same climate
              </span>
            </div>
          </div>
        </div>

        <div className="rail-note">
          Terrain is generated, not measured: a noise surface carved by droplet
          hydraulic erosion, parameterised by the depositional setting. Channels
          follow flow accumulation. Drop a real DEM in as the base surface and
          nothing downstream changes.
        </div>
      </aside>

      <div className="map">
        {terrain ? (
          <MapView
            terrain={terrain}
            climate={climate}
            spawns={spawns}
            loggedKeys={loggedKeys}
            onSelect={(s) => setPanel({ kind: "encounter", spawn: s })}
          />
        ) : (
          <div className="building">
            <div className="inner">
              <div className="msg">Carving {facies.label.toLowerCase()}</div>
              <div className="progress">
                <i style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <div className="label" style={{ color: "var(--mute)" }}>
                {Math.round(progress * 100)}% · hydraulic erosion
              </div>
            </div>
          </div>
        )}

        <button className="journal-fab" onClick={() => setPanel({ kind: "journal" })}>
          <span className="cnt">{sightings.length}</span>
          <span className="lbl">
            Field
            <br />
            Journal
          </span>
        </button>
      </div>

      <CoreScrubber ka={ka} onChange={setKa} />

      {panel?.kind === "encounter" && (
        <Panel title="Encounter" subtitle={`${formation.name} · ${formatAge(ka)}`} onClose={() => setPanel(null)}>
          <EncounterView
            spawn={panel.spawn}
            ctx={ctx}
            logged={loggedKeys.has(panel.spawn.key)}
            onSketch={() => setPanel({ kind: "sketch", spawn: panel.spawn })}
            onClose={() => setPanel(null)}
          />
        </Panel>
      )}

      {panel?.kind === "sketch" && (
        <Panel title="Field sketch" subtitle="Drawing from life" onClose={() => setPanel(null)}>
          <SketchView
            spawn={panel.spawn}
            ctx={ctx}
            onDiscard={() => setPanel(null)}
            onSave={(given) => {
              add({
                id: "s" + Date.now().toString(36),
                spawnKey: panel.spawn.key,
                speciesId: panel.spawn.species.id,
                seed: panel.spawn.seed,
                given,
                ka,
                place: SITE.place,
                lat: SITE.lat,
                lng: SITE.lng,
                formation: formation.name,
                facies: facies.label,
                tier: panel.spawn.species.tier,
                at: Date.now()
              });
              setPanel(null);
              say(`${given} added to your field journal`);
            }}
          />
        </Panel>
      )}

      {panel?.kind === "journal" && (
        <Panel
          title="Field Journal"
          subtitle={
            sightings.length
              ? `${sightings.length} sighting${sightings.length === 1 ? "" : "s"} · ${speciesSeen} of ${SPECIES.length} taxa`
              : "No entries"
          }
          wide
          onClose={() => setPanel(null)}
        >
          <JournalGrid sightings={sightings} onOpen={(s) => setPanel({ kind: "entry", sighting: s })} />
        </Panel>
      )}

      {panel?.kind === "entry" && (
        <Panel
          title="Journal entry"
          subtitle={formatAge(panel.sighting.ka)}
          onClose={() => setPanel({ kind: "journal" })}
        >
          <EntryView sighting={panel.sighting} />
        </Panel>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
