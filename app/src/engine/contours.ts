/** Marching squares over the heightfield.
 *
 *  Contours are extracted once, in survey space, and stored as flat segment
 *  buffers. Panning and zooming then only applies a transform — no
 *  re-extraction — which is what keeps the map smooth under the hand. */

export interface ContourLevel {
  value: number;
  /** Flat [x1,y1,x2,y2, ...] in cell coordinates. */
  segments: Float32Array;
  index: boolean;
}

export function extractContours(
  h: Float32Array,
  size: number,
  minH: number,
  maxH: number,
  levelCount: number,
  step = 2
): ContourLevel[] {
  const out: ContourLevel[] = [];
  const at = (x: number, y: number) => h[y * size + x];

  for (let li = 1; li <= levelCount; li++) {
    const t = li / (levelCount + 1);
    const lv = minH + (maxH - minH) * t;
    const pts: number[] = [];

    for (let y = 0; y + step < size; y += step) {
      for (let x = 0; x + step < size; x += step) {
        const a = at(x, y);
        const b = at(x + step, y);
        const c = at(x + step, y + step);
        const d = at(x, y + step);

        let idx = 0;
        if (a > lv) idx |= 8;
        if (b > lv) idx |= 4;
        if (c > lv) idx |= 2;
        if (d > lv) idx |= 1;
        if (idx === 0 || idx === 15) continue;

        const T = (p: number, q: number) => (lv - p) / (q - p || 1e-6);
        const top: [number, number] = [x + step * T(a, b), y];
        const right: [number, number] = [x + step, y + step * T(b, c)];
        const bottom: [number, number] = [x + step * T(d, c), y + step];
        const left: [number, number] = [x, y + step * T(a, d)];

        const seg = (p: [number, number], q: [number, number]) => {
          pts.push(p[0], p[1], q[0], q[1]);
        };

        switch (idx) {
          case 1:
          case 14:
            seg(left, bottom);
            break;
          case 2:
          case 13:
            seg(bottom, right);
            break;
          case 3:
          case 12:
            seg(left, right);
            break;
          case 4:
          case 11:
            seg(top, right);
            break;
          case 6:
          case 9:
            seg(top, bottom);
            break;
          case 7:
          case 8:
            seg(left, top);
            break;
          case 5:
            seg(left, top);
            seg(bottom, right);
            break;
          case 10:
            seg(left, bottom);
            seg(top, right);
            break;
        }
      }
    }

    out.push({ value: lv, segments: new Float32Array(pts), index: li % 5 === 0 });
  }
  return out;
}
