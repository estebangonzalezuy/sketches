/** Layer-space geometry. Pure: no DOM, so every shape effect is unit-testable. */
export type Pt = [number, number];
export type Rect = { x: number; y: number; w: number; h: number };

/** One fill: closed contours drawn together with the nonzero rule (letters keep their counters). */
export type ShapePath = { fill: string; contours: Pt[][] };

export type VectorContent = { kind: "vector"; paths: ShapePath[] };
/** A bitmap placed in layer space; `canvas` covers `rect` at some device resolution. */
export type RasterContent = { kind: "raster"; canvas: HTMLCanvasElement | OffscreenCanvas; rect: Rect };
export type Content = VectorContent | RasterContent;

export function bboxOf(paths: ShapePath[]): Rect {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of paths)
    for (const c of p.contours)
      for (const [x, y] of c) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
  if (x0 === Infinity) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export const contentBox = (c: Content): Rect => (c.kind === "vector" ? bboxOf(c.paths) : c.rect);

export const mapPaths = (paths: ShapePath[], f: (p: Pt) => Pt): ShapePath[] =>
  paths.map((p) => ({ ...p, contours: p.contours.map((c) => c.map(f)) }));

/** Splits every edge so no segment is longer than `max`: needed before a curved warp. */
export function subdivide(paths: ShapePath[], max: number): ShapePath[] {
  if (!(max > 0)) return paths;
  return paths.map((p) => ({
    ...p,
    contours: p.contours.map((c) => {
      const out: Pt[] = [];
      for (let i = 0; i < c.length; i++) {
        const a = c[i];
        const b = c[(i + 1) % c.length];
        const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / max));
        for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
      }
      return out;
    }),
  }));
}

/** 3×3 projective map (row-major, h[8] = 1) taking the unit square to quad tl, tr, br, bl. */
export function squareToQuad([p0, p1, p2, p3]: [Pt, Pt, Pt, Pt]): number[] {
  const [x0, y0] = p0;
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) return [x1 - x0, x3 - x0, x0, y1 - y0, y3 - y0, y0, 0, 0, 1];
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}

export function project(m: number[], u: number, v: number): Pt {
  const w = m[6] * u + m[7] * v + m[8];
  return [(m[0] * u + m[1] * v + m[2]) / w, (m[3] * u + m[4] * v + m[5]) / w];
}

/** Inverse of a 3×3 matrix (adjugate / determinant). */
export function invert3(m: number[]): number[] {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  const k = 1 / det;
  return [A * k, -(b * i - c * h) * k, (b * f - c * e) * k, B * k, (a * i - c * g) * k, -(a * f - c * d) * k, C * k, -(a * h - b * g) * k, (a * e - b * d) * k];
}
