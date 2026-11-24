import type { Bands, Block, Mark, Palette } from "./types";

export interface Pen {
  pal: Palette;
  /** outline weight */
  lw: number;
  /** line-art mode: every fill is paper */
  line: boolean;
  /** device px per poster px (for the inked headline raster) */
  scale: number;
  /** squares mode: motif interiors are cut out so the painted squares show through */
  cut: boolean;
  /** construct: typed notes inside each box first */
  notes?: boolean;
  /** "questions" mode lines per element id */
  lines?: Map<string, string[]>;
}

/** Marker for a fill that erases (destination-out) instead of painting. */
export const CUT = "cut";

/** Fill for a motif's body (petals, discs): see-through in squares mode. */
export const motifFill = (pen: Pen, s: keyof Palette) => (pen.cut ? CUT : fillOf(pen, s));

/** Fill (or cut) then outline the current path. */
export function fillStroke(ctx: CanvasRenderingContext2D, pen: Pen, fill: string, lw = pen.lw) {
  if (fill === CUT) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  } else {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = pen.pal.ink;
  ctx.lineWidth = lw;
  ctx.stroke();
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

/** Six-arm asterisk; `round` takes the arm ends from sharp (0) to fully round (1). Optional outlined box. */
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
    if (m.boxLine !== false) ctx.strokeRect(m.cx - s * 1.05, m.cy - s * 1.05, s * 2.1, s * 2.1);
    ctx.globalAlpha = 1;
  }
  ctx.translate(m.cx, m.cy);
  ctx.rotate(spin + (1 - p) * -Math.PI * 0.6);
  ctx.scale(p, p);
  const w = s * 0.34;
  const L = s * 0.9;
  const r = Math.min(1, Math.max(0, m.round ?? 1)) * (w / 2);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 3);
    const x = -w / 2;
    const y = -L;
    const h = L;
    // arm: rounded only at the outer end
    ctx.moveTo(x, 0);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.restore();
  }
  ctx.moveTo(w * 0.62, 0);
  ctx.arc(0, 0, w * 0.62, 0, Math.PI * 2);
  if (pen.line) {
    ctx.strokeStyle = pen.pal.ink;
    ctx.lineWidth = pen.lw * 2;
    ctx.stroke();
    ctx.fillStyle = pen.pal.paper;
  } else ctx.fillStyle = pen.pal[m.fill];
  ctx.fill("nonzero");
  ctx.restore();
}
