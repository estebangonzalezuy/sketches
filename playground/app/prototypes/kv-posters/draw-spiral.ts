import { fillOf, type Pen } from "./draw-shapes";
import type { Spiral } from "./types";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const out = (v: number) => 1 - (1 - clamp01(v)) ** 3;

/** Rings of overlapping discs, each ring twisted a little further, drawn outside-in. */
export function drawSpiral(ctx: CanvasRenderingContext2D, s: Spiral, pen: Pen, p: number, spin: number) {
  if (p <= 0) return;
  ctx.save();
  ctx.translate(s.cx, s.cy);
  for (let k = s.rings - 1; k >= 0; k--) {
    const g = out(p * 1.6 - (s.rings - 1 - k) * 0.14);
    if (g <= 0) continue;
    const rr = s.r * (0.3 + (0.7 * (k + 1)) / s.rings) * g;
    const cr = rr * 0.42;
    const twist = s.rot + k * 0.5 + spin * (1 + (s.rings - k) * 0.15) - (1 - g) * 1.2;
    for (let j = 0; j < s.perRing; j++) {
      const a = twist + (j * Math.PI * 2) / s.perRing;
      const x = Math.cos(a) * (rr - cr);
      const y = Math.sin(a) * (rr - cr);
      ctx.beginPath();
      ctx.arc(x, y, cr, 0, Math.PI * 2);
      ctx.fillStyle = fillOf(pen, s.fills[(j + k) % s.fills.length]);
      ctx.fill();
      ctx.strokeStyle = pen.pal.ink;
      ctx.lineWidth = pen.lw;
      ctx.stroke();
      if (k === s.rings - 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + Math.PI / 2);
        ctx.beginPath();
        ctx.rect(-cr * 0.05, -cr * 0.9, cr * 0.1, cr * 0.55);
        ctx.fillStyle = fillOf(pen, "cream");
        ctx.fill();
        ctx.lineWidth = pen.lw * 0.6;
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  const c = out(p * 2 - 0.8);
  if (c > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, s.r * 0.2 * c, 0, Math.PI * 2);
    ctx.fillStyle = fillOf(pen, "cream");
    ctx.fill();
    ctx.lineWidth = pen.lw;
    ctx.stroke();
  }
  ctx.restore();
}
