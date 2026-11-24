import type { Arc, Bands, Block, Mark, Palette } from "./types";

export interface Pen {
  pal: Palette;
  /** outline weight */
  lw: number;
  /** line-art mode: every fill is paper */
  line: boolean;
  /** device px per poster px (for the inked headline raster) */
  scale: number;
}

export const fillOf = (pen: Pen, s: keyof Palette) => (pen.line && s !== "ink" ? pen.pal.paper : pen.pal[s]);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function drawBlock(ctx: CanvasRenderingContext2D, b: Block, pen: Pen, p: number) {
  if (p <= 0) return;
  const w = b.w >= b.h ? b.w * p : b.w;
  const h = b.w >= b.h ? b.h : b.h * p;
  if (pen.line) {
    ctx.strokeStyle = pen.pal.ink;
    ctx.lineWidth = pen.lw * 0.4;
    ctx.strokeRect(b.x, b.y, w, h);
    return;
  }
  ctx.fillStyle = pen.pal[b.fill];
  ctx.fillRect(b.x, b.y, w, h);
}

export function drawBands(ctx: CanvasRenderingContext2D, b: Bands, pen: Pen, p: number) {
  b.fills.forEach((f, i) => {
    const k = clamp01(p * (b.fills.length + 1) - i);
    if (k <= 0) return;
    const o = i * b.band;
    const x = b.x + o;
    const y = b.y + o;
    const w = b.w - 2 * o;
    const h = (b.h - 2 * o) * k;
    if (w <= 2 * b.band || h <= 0) return;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.rect(x + b.band, y + b.band, w - 2 * b.band, Math.max(0, h - 2 * b.band));
    ctx.fillStyle = fillOf(pen, f);
    ctx.fill("evenodd");
    ctx.strokeStyle = pen.pal.ink;
    ctx.lineWidth = pen.lw * 0.4;
    ctx.stroke();
  });
}

export function drawArc(ctx: CanvasRenderingContext2D, a: Arc, pen: Pen, p: number) {
  if (p <= 0) return;
  const end = a.start + (a.end - a.start) * p;
  a.fills.forEach((f, i) => {
    const r0 = a.r + i * a.band;
    ctx.beginPath();
    ctx.arc(a.cx, a.cy, r0 + a.band, a.start, end);
    ctx.arc(a.cx, a.cy, r0, end, a.start, true);
    ctx.closePath();
    ctx.fillStyle = fillOf(pen, f);
    ctx.fill();
    ctx.strokeStyle = pen.pal.ink;
    ctx.lineWidth = pen.lw * 0.8;
    ctx.stroke();
  });
}

/** Rounded six-arm asterisk, optionally in an outlined box. */
export function drawMark(ctx: CanvasRenderingContext2D, m: Mark, pen: Pen, p: number, spin: number) {
  if (p <= 0) return;
  const s = m.size;
  ctx.save();
  if (m.box) {
    ctx.fillStyle = fillOf(pen, "cream");
    ctx.strokeStyle = pen.pal.ink;
    ctx.lineWidth = pen.lw * 0.6;
    ctx.globalAlpha = clamp01(p * 3);
    ctx.fillRect(m.cx - s * 1.05, m.cy - s * 1.05, s * 2.1, s * 2.1);
    ctx.strokeRect(m.cx - s * 1.05, m.cy - s * 1.05, s * 2.1, s * 2.1);
    ctx.globalAlpha = 1;
  }
  ctx.translate(m.cx, m.cy);
  ctx.rotate(spin + (1 - p) * -Math.PI * 0.6);
  ctx.scale(p, p);
  ctx.lineCap = "round";
  const arms = () => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * s * 0.72, Math.sin(a) * s * 0.72);
    }
  };
  if (pen.line) {
    ctx.strokeStyle = pen.pal.ink;
    ctx.lineWidth = s * 0.34;
    arms();
    ctx.stroke();
    ctx.strokeStyle = pen.pal.paper;
    ctx.lineWidth = s * 0.34 - pen.lw * 1.6;
    arms();
    ctx.stroke();
  } else {
    ctx.strokeStyle = pen.pal[m.fill];
    ctx.lineWidth = s * 0.34;
    arms();
    ctx.stroke();
  }
  ctx.restore();
}
