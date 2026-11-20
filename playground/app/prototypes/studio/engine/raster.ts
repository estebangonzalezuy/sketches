import { bboxOf, type RasterContent, type ShapePath } from "./geometry";

export function tracePaths(ctx: CanvasRenderingContext2D, paths: ShapePath[]) {
  for (const p of paths) {
    ctx.beginPath();
    for (const c of p.contours) {
      if (c.length < 2) continue;
      ctx.moveTo(c[0][0], c[0][1]);
      for (let i = 1; i < c.length; i++) ctx.lineTo(c[i][0], c[i][1]);
      ctx.closePath();
    }
    ctx.fillStyle = p.fill;
    ctx.fill("nonzero");
  }
}

/** Vector → bitmap at `scale` device px per layer px, with a margin for effects that spill. */
export function rasterize(paths: ShapePath[], scale: number, margin = 2): RasterContent {
  const b = bboxOf(paths);
  const rect = { x: b.x - margin, y: b.y - margin, w: b.w + 2 * margin, h: b.h + 2 * margin };
  const s = Math.min(scale, 4096 / Math.max(1, rect.w), 4096 / Math.max(1, rect.h));
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.ceil(rect.w * s));
  cv.height = Math.max(1, Math.ceil(rect.h * s));
  const g = cv.getContext("2d")!;
  g.setTransform(s, 0, 0, s, -rect.x * s, -rect.y * s);
  tracePaths(g, paths);
  return { kind: "raster", canvas: cv, rect };
}
