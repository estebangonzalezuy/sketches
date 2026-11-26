import type { Ctx } from "./canvas-type";

/**
 * A pattern of outlined dots (rings, no fill) printed under everything on the cover.
 * Deterministic (the scatter uses a seeded random), so exports repeat exactly. Sizes are in
 * page pixels (1440 wide); the line weight follows the dot size.
 */

export const DOT_PATTERNS = ["Grid", "Halftone", "Scatter"] as const;
export type DotPattern = (typeof DOT_PATTERNS)[number];
export type CoverDots = { on: boolean; pattern: DotPattern; size: number; spacing: number; color: string };

export function drawCoverDots(ctx: Ctx, w: number, h: number, d: CoverDots) {
  if (!d.on) return;
  ctx.save();
  ctx.strokeStyle = d.color;
  ctx.lineWidth = Math.max(1.2, d.size * 0.1);
  const dot = (x: number, y: number, r: number) => {
    if (r <= ctx.lineWidth) return;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  };
  const s = d.spacing;
  const r = d.size / 2;
  if (d.pattern === "Scatter") {
    let seed = 1729;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const n = Math.round((w * h) / (s * s));
    for (let i = 0; i < n; i++) dot(rand() * w, rand() * h, r * (0.5 + rand()));
  } else {
    for (let row = 0, y = s / 2; y < h + s; row++, y += s) {
      // halftone rows are offset like a print screen; dots are largest at the head of the page
      // and fade out before the names at the foot
      const off = d.pattern === "Halftone" && row % 2 ? s / 2 : 0;
      const k = d.pattern === "Halftone" ? Math.max(0, 1 - y / (h * 0.62)) ** 1.3 * 1.6 : 1;
      for (let x = s / 2 + off; x < w + s; x += s) dot(x, y, r * k);
    }
  }
  ctx.restore();
}
