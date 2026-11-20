import { bboxOf, mapPaths, project, squareToQuad, subdivide, type Pt, type ShapePath } from "./geometry";

/**
 * Corner pin: the shape's box goes to the quad of four pins. Pins are in box units
 * ([0,0] top-left … [1,1] bottom-right), so they survive a change of text or size.
 */
export function cornerPin(paths: ShapePath[], pins: [Pt, Pt, Pt, Pt]): ShapePath[] {
  const b = bboxOf(paths);
  if (b.w <= 0 || b.h <= 0) return paths;
  const quad = pins.map(([u, v]) => [b.x + u * b.w, b.y + v * b.h] as Pt) as [Pt, Pt, Pt, Pt];
  const m = squareToQuad(quad);
  // straight edges stay straight under a projective map, but long ones read better split
  return mapPaths(subdivide(paths, Math.max(b.w, b.h) / 24), ([x, y]) => project(m, (x - b.x) / b.w, (y - b.y) / b.h));
}

/**
 * Radial warp: the box is bent around `center`. x becomes the angle (the box width spans
 * `sweep` degrees starting at `angle`), y becomes the radius (from `inner` outwards, `depth`
 * px for the box height). `amount` blends from the flat shape (0) to the full warp (1).
 */
export function radialWarp(
  paths: ShapePath[],
  o: { center: Pt; inner: number; depth: number; angle: number; sweep: number; amount: number },
): ShapePath[] {
  const b = bboxOf(paths);
  if (b.w <= 0 || b.h <= 0 || o.amount <= 0) return paths;
  const a0 = (o.angle * Math.PI) / 180;
  const sw = (o.sweep * Math.PI) / 180;
  const k = Math.max(0, Math.min(1, o.amount));
  return mapPaths(subdivide(paths, Math.max(b.w, b.h) / 160), ([x, y]) => {
    const u = (x - b.x) / b.w;
    const v = (y - b.y) / b.h;
    const ang = a0 + u * sw;
    // the top of the box sits on the outer radius, like letters standing on a ring
    const r = o.inner + (1 - v) * o.depth;
    const wx = o.center[0] + r * Math.cos(ang);
    const wy = o.center[1] + r * Math.sin(ang);
    return [x + (wx - x) * k, y + (wy - y) * k];
  });
}
