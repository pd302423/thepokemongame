import { useEffect, useMemo, useRef } from "react";
import { makeScribble } from "../engine/scribble";
import type { Species } from "../engine/species";

interface Props {
  species: Species;
  seed: string;
  thumb?: boolean;
  /** Draw the strokes on, in order, as if the sketch were being made. */
  animate?: boolean;
  onDone?: () => void;
}

const DURATION = 1500;

export default function SketchPlate({ species, seed, thumb, animate, onDone }: Props) {
  const scribble = useMemo(() => makeScribble(species, seed, { thumb }), [species, seed, thumb]);
  const svgRef = useRef<SVGSVGElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!animate) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const svg = svgRef.current;
    if (!svg) return;

    const paths = svg.querySelectorAll<SVGPathElement>("path[data-order]");
    if (reduce) {
      paths.forEach((p) => {
        p.style.strokeDashoffset = "0";
        p.style.opacity = p.dataset.opacity ?? "1";
      });
      const t = setTimeout(() => doneRef.current?.(), 60);
      return () => clearTimeout(t);
    }

    paths.forEach((p) => {
      const order = Number(p.dataset.order);
      const delay = (order / scribble.total) * DURATION;
      p.style.transition = `stroke-dashoffset 250ms linear ${delay}ms, opacity 150ms linear ${delay}ms`;
    });
    const raf = requestAnimationFrame(() => {
      paths.forEach((p) => {
        p.style.strokeDashoffset = "0";
        p.style.opacity = p.dataset.opacity ?? "1";
      });
    });
    const t = setTimeout(() => doneRef.current?.(), DURATION + 320);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [animate, scribble, seed]);

  const clipped = scribble.strokes.filter((s) => s.clipped);
  const loose = scribble.strokes.filter((s) => !s.clipped);

  const render = (s: (typeof scribble.strokes)[number]) => {
    const hidden = animate;
    if (s.fill) {
      return (
        <path
          key={s.order}
          d={s.d}
          fill="#141210"
          data-order={s.order}
          data-opacity="1"
          style={hidden ? { opacity: 0 } : undefined}
        />
      );
    }
    return (
      <path
        key={s.order}
        d={s.d}
        fill="none"
        stroke={s.color}
        strokeWidth={s.w}
        strokeLinecap="round"
        strokeLinejoin="round"
        data-order={s.order}
        data-opacity={s.opacity}
        style={{
          opacity: s.opacity,
          strokeDasharray: s.len,
          strokeDashoffset: hidden ? s.len : 0
        }}
      />
    );
  };

  return (
    <svg ref={svgRef} viewBox="-6 0 216 140" role="img" aria-label={`Field sketch of ${species.binomial}`}>
      <defs>
        <clipPath id={scribble.clipId}>
          {scribble.clip.map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
          ))}
        </clipPath>
      </defs>
      <g clipPath={`url(#${scribble.clipId})`}>{clipped.map(render)}</g>
      {loose.map(render)}
    </svg>
  );
}
