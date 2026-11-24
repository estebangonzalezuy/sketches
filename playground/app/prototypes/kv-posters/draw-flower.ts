import { fillOf, type Pen } from "./draw-shapes";
import type { Flower } from "./types";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const out = (v: number) => 1 - (1 - clamp01(v)) ** 3;

function shape(ctx: CanvasRenderingContext2D, pen: Pen, fill: string, draw: () => void, lw = pen.lw) {
  ctx.beginPath();
  draw();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = pen.pal.ink;
  ctx.lineWidth = lw;
  ctx.stroke();
}

/** Seven circles: one in the middle, six around, popping in after `from`. */
function dots(ctx: CanvasRenderingContext2D, pen: Pen, f: Flower, r: number, p: number, from: number) {
  const d = r * 0.135;
  for (let i = 0; i < 7; i++) {
    const k = out((p - from) / (1 - from) * 7 - i * 0.6);
    if (k <= 0) continue;
    const a = (i - 1) * (Math.PI / 3);
    const [x, y] = i === 0 ? [0, 0] : [Math.cos(a) * d * 2.05, Math.sin(a) * d * 2.05];
    shape(ctx, pen, fillOf(pen, f.dots), () => ctx.arc(x, y, d * k, 0, Math.PI * 2));
  }
}

function ticks(ctx: CanvasRenderingContext2D, pen: Pen, f: Flower, r: number, k: number) {
  if (!f.ticks || k <= 0) return;
  const n = f.petals;
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.rotate(((i + 0.5) * Math.PI * 2) / n);
    const len = r * 0.3 * k;
    shape(ctx, pen, fillOf(pen, "cream"), () => ctx.rect(-r * 0.022, -r * 0.5 - len, r * 0.044, len), pen.lw * 0.6);
    shape(ctx, pen, fillOf(pen, "cream"), () => ctx.rect(-r * 0.022, -r * 0.88 - r * 0.044, r * 0.044 * k, r * 0.044 * k), pen.lw * 0.6);
    ctx.restore();
  }
}

/** Scalloped rosette rings (the line-art reference). */
function scallops(ctx: CanvasRenderingContext2D, pen: Pen, f: Flower, R: number, p: number) {
  for (const [ring, k] of [[1, out(p * 1.5)], [0.84, out(p * 1.5 - 0.2)]] as const) {
    if (k <= 0) continue;
    const rr = R * ring * k;
    const n = f.petals;
    const b = rr * Math.sin(Math.PI / n) * 1.15;
    const bumps = () => {
      for (let i = 0; i < n; i++) {
        const a = (i * Math.PI * 2) / n;
        ctx.moveTo(Math.cos(a) * (rr - b) + b, Math.sin(a) * (rr - b));
        ctx.arc(Math.cos(a) * (rr - b), Math.sin(a) * (rr - b), b, 0, Math.PI * 2);
      }
    };
    ctx.beginPath();
    bumps();
    ctx.strokeStyle = pen.pal.ink;
    ctx.lineWidth = pen.lw * 2;
    ctx.stroke();
    ctx.fillStyle = fillOf(pen, f.fills[0] ?? "cream");
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, rr - b * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawFlower(ctx: CanvasRenderingContext2D, f: Flower, pen: Pen, p: number, spin: number) {
  if (p <= 0) return;
  const { r, petals: n } = f;
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rot + spin - (1 - out(p)) * 0.8);
  if (f.style === "scallop") scallops(ctx, pen, f, r, p);
  else {
    const pr = r * 0.32;
    for (let i = 0; i < n; i++) {
      const k = out(p * 1.8 - (i / n) * 0.8);
      if (k <= 0) continue;
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / n);
      shape(ctx, pen, fillOf(pen, f.fills[i % f.fills.length]), () => ctx.ellipse(0, -(r - pr) * k, pr * 1.05 * k, pr * 1.12 * k, 0, 0, Math.PI * 2));
      ctx.restore();
    }
  }
  ticks(ctx, pen, f, r, out(p * 2 - 0.9));
  const disc = out(p * 2.2 - 0.4);
  if (disc > 0) shape(ctx, pen, fillOf(pen, f.disc), () => ctx.arc(0, 0, r * 0.5 * disc, 0, Math.PI * 2));
  dots(ctx, pen, f, r, p, 0.45);
  ctx.restore();
}
