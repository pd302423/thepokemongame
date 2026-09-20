import { useState } from "react";
import SketchPlate from "./SketchPlate";
import { TIER_BLURB, TIER_LABEL, type Species } from "../engine/species";
import { suggestName, traitsFor } from "../engine/scribble";
import { formatAge } from "../engine/climate";
import type { Spawn } from "../engine/spawns";

interface Context {
  place: string;
  lat: number;
  lng: number;
  ka: number;
  formation: string;
  facies: string;
  climate: string;
}

function Traits({ sp, seed }: { sp: Species; seed: string }) {
  const t = traitsFor(sp, seed);
  return (
    <div className="traits">
      <span className="trait">{t.ageClass}</span>
      <span className="trait">{t.build}</span>
      <span className="trait">{t.coatWord}</span>
      {t.scarred && <span className="trait">old flank scar</span>}
    </div>
  );
}

export function EncounterView({
  spawn,
  ctx,
  logged,
  onSketch,
  onClose
}: {
  spawn: Spawn;
  ctx: Context;
  logged: boolean;
  onSketch: () => void;
  onClose: () => void;
}) {
  const sp = spawn.species;
  return (
    <>
      <span className="tier" data-t={sp.tier}>
        {TIER_LABEL[sp.tier]}
      </span>
      <h3 className="binomial">{sp.binomial}</h3>
      <div className="common">{sp.common}</div>

      <div className="plate">
        <SketchPlate species={sp} seed={spawn.seed} />
        <div className="plate-cap">
          <span>{sp.formation}</span>
          <span>{formatAge(ctx.ka)}</span>
        </div>
      </div>

      <dl className="facts">
        <div className="fact">
          <dt>Mass</dt>
          <dd>{sp.mass}</dd>
        </div>
        <div className="fact">
          <dt>Height</dt>
          <dd>{sp.height}</dd>
        </div>
        <div className="fact">
          <dt>Range</dt>
          <dd>
            {formatAge(sp.from)}–{formatAge(sp.to)}
          </dd>
        </div>
        <div className="fact">
          <dt>Diet</dt>
          <dd style={{ fontSize: 11 }}>{sp.diet}</dd>
        </div>
      </dl>

      <p className="note">{sp.note}</p>
      <Traits sp={sp} seed={spawn.seed} />
      <div className="cite">{TIER_BLURB[sp.tier]}</div>

      {logged ? (
        <button className="act ghost" onClick={onClose}>
          Already in your journal
        </button>
      ) : (
        <button className="act" onClick={onSketch}>
          Sketch it
        </button>
      )}
    </>
  );
}

export function SketchView({
  spawn,
  ctx,
  onSave,
  onDiscard
}: {
  spawn: Spawn;
  ctx: Context;
  onSave: (name: string) => void;
  onDiscard: () => void;
}) {
  const sp = spawn.species;
  const [drawn, setDrawn] = useState(false);
  const [value, setValue] = useState("");
  const [nonce, setNonce] = useState(0);
  const placeholder = suggestName(spawn.seed + nonce);

  return (
    <>
      <span className="tier" data-t={sp.tier}>
        {TIER_LABEL[sp.tier]}
      </span>
      <h3 className="binomial">{sp.binomial}</h3>
      <div className="common">{sp.common}</div>

      <div className="plate">
        <SketchPlate species={sp} seed={spawn.seed} animate onDone={() => setDrawn(true)} />
        <div className="plate-cap">
          <span>{ctx.place}</span>
          <span>{formatAge(ctx.ka)}</span>
        </div>
      </div>

      {drawn && (
        <>
          <div className="namerow">
            <input
              id="sighting-name"
              type="text"
              maxLength={40}
              value={value}
              placeholder={placeholder}
              aria-label="Name this individual"
              autoComplete="off"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSave(value.trim() || placeholder)}
            />
            <button className="dice" onClick={() => setNonce((n) => n + 1)} aria-label="Suggest another name">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="1.5" y="1.5" width="12" height="12" rx="1.5" />
                <circle cx="5" cy="5" r="1.1" fill="currentColor" stroke="none" />
                <circle cx="7.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
                <circle cx="10" cy="10" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </div>

          <div className="provenance">
            <b>{ctx.place}</b>
            <br />
            {ctx.lat.toFixed(4)}° N · {ctx.lng.toFixed(4)}° E
            <br />
            {ctx.formation} · {ctx.facies}
            <br />
            {formatAge(ctx.ka)} before present · {ctx.climate}
          </div>

          <button className="act" onClick={() => onSave(value.trim() || placeholder)}>
            Add to journal
          </button>
          <button className="act ghost" onClick={onDiscard}>
            Discard sketch
          </button>
        </>
      )}
    </>
  );
}
