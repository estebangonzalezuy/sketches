import { bboxOf, type Pt, type ShapePath } from "./geometry";

/**
 * Pixel of the shape, not of the picture: each cell of a grid anchored at the layer origin is
 * filled when its centre is inside the shape (nonzero rule), and the filled cells come back as
 * vector squares, merged into runs. Later shape effects (corner pin, warp) bend the cells too.
 */
export function pixelShape(paths: ShapePath[], cell: number): ShapePath[] {
  if (!(cell >= 1)) return paths;
  return paths.map((p) => ({ fill: p.fill, contours: cellsOf(p.contours, cell) }));
}

function cellsOf(contours: Pt[][], cell: number): Pt[][] {
  const b = bboxOf([{ fill: "", contours }]);
  if (b.w <= 0 || b.h <= 0) return [];
  const out: Pt[][] = [];
  const j0 = Math.floor(b.y / cell);
  const j1 = Math.ceil((b.y + b.h) / cell);
  const i0 = Math.floor(b.x / cell);
  for (let j = j0; j < j1; j++) {
    const yc = (j + 0.5) * cell;
    const spans = spansAt(contours, yc);
    if (!spans.length) continue;
    // walk the cells of this row, merging consecutive filled ones into one rectangle
    // (cell indices go negative left of the layer origin, so "no run" is null, not -1)
    let run: number | null = null;
    const flush = (end: number) => {
      if (run === null) return;
      const x0 = run * cell;
      const x1 = end * cell;
      out.push([[x0, j * cell], [x1, j * cell], [x1, (j + 1) * cell], [x0, (j + 1) * cell]]);
      run = null;
    };
    const i1 = Math.ceil((b.x + b.w) / cell);
    for (let i = i0; i < i1; i++) {
      const xc = (i + 0.5) * cell;
      const inside = spans.some(([a, z]) => xc >= a && xc <= z);
      if (inside && run === null) run = i;
      else if (!inside) flush(i);
    }
    flush(i1);
  }
  return out;
}

/** Filled x-intervals of a horizontal line through the contours, by nonzero winding. */
export function spansAt(contours: Pt[][], y: number): [number, number][] {
  const hits: { x: number; w: number }[] = [];
  for (const c of contours)
    for (let i = 0; i < c.length; i++) {
      const [ax, ay] = c[i];
      const [bx, by] = c[(i + 1) % c.length];
      if (ay === by) continue;
      const up = ay < by;
      if ((up && y >= ay && y < by) || (!up && y >= by && y < ay)) hits.push({ x: ax + ((y - ay) * (bx - ax)) / (by - ay), w: up ? 1 : -1 });
    }
  hits.sort((a, b) => a.x - b.x);
  const out: [number, number][] = [];
  let wind = 0;
  let start = 0;
  for (const h of hits) {
    const was = wind;
    wind += h.w;
    if (was === 0 && wind !== 0) start = h.x;
    else if (was !== 0 && wind === 0) out.push([start, h.x]);
  }
  return out;
}
