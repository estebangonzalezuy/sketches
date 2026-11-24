import { getFont } from "@/lib/kv/fonts";
import { fillOf, type Pen } from "./draw-shapes";
import type { Headline, Lockup } from "./types";

interface Set {
  path: Path2D;
  x: number;
  y: number;
  w: number;
  h: number;
}

const cache = new Map<string, Set>();
const LEADING = 0.86;

/** Headline outlines from Barlow Condensed Black (opentype.js), origin at the first baseline. */
export function headlineSet(text: string, size: number): Set {
  const key = `${text}|${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const font = getFont("barlow");
  const em = size / font.unitsPerEm;
  const path = new Path2D();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  text.split("\n").forEach((line, li) => {
    let pen = 0;
    let prev: ReturnType<typeof font.charToGlyph> | null = null;
    for (const ch of line) {
      const g = font.charToGlyph(ch);
      if (prev) pen += font.getKerningValue(prev, g) * em;
      for (const c of g.getPath(pen, li * size * LEADING, size).commands) {
        if (c.type === "Z") path.closePath();
        else {
          if (c.type === "M") path.moveTo(c.x, c.y);
          else if (c.type === "L") path.lineTo(c.x, c.y);
          else if (c.type === "Q") path.quadraticCurveTo(c.x1, c.y1, c.x, c.y);
          else if (c.type === "C") path.bezierCurveTo(c.x1, c.y1, c.x2, c.y2, c.x, c.y);
          x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y);
        }
      }
      pen += (g.advanceWidth ?? 0) * em - size * 0.01;
      prev = g;
    }
  });
  const set = { path, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  cache.set(key, set);
  return set;
}

const pad = (size: number) => size * 0.08;

/** Box size of a headline (horizontal), padding included. */
export function headlineBox(text: string, size: number) {
  const s = headlineSet(text, size);
  return { w: s.w + 2 * pad(size), h: s.h + 2 * pad(size) };
}

export function drawHeadline(ctx: CanvasRenderingContext2D, h: Headline, pen: Pen, p: number) {
  if (p <= 0) return;
  const s = headlineSet(h.text, h.size);
  const b = headlineBox(h.text, h.size);
  ctx.save();
  if (h.vertical) {
    ctx.translate(h.x + b.h, h.y);
    ctx.rotate(Math.PI / 2);
  } else ctx.translate(h.x, h.y);
  if (h.box) {
    ctx.fillStyle = fillOf(pen, "cream");
    ctx.strokeStyle = pen.pal.ink;
    ctx.lineWidth = pen.lw * 0.6;
    const w = b.w * Math.min(1, p * 2);
    ctx.fillRect(0, 0, w, b.h);
    ctx.strokeRect(0, 0, w, b.h);
  }
  ctx.beginPath();
  ctx.rect(0, 0, b.w, b.h);
  ctx.clip();
  const k = 1 - (1 - Math.min(1, Math.max(0, p * 1.4 - 0.3))) ** 3;
  ctx.translate(pad(h.size) - s.x, pad(h.size) - s.y + (1 - k) * b.h);
  if (pen.line) {
    ctx.fillStyle = pen.pal.paper;
    ctx.fill(s.path);
    ctx.strokeStyle = pen.pal.ink;
    ctx.lineWidth = pen.lw;
    ctx.stroke(s.path);
  } else {
    ctx.fillStyle = pen.pal.ink;
    ctx.fill(s.path);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- lockup

const FONT = (size: number) => `600 ${size}px "KV Inter"`;
let mctx: CanvasRenderingContext2D | null = null;

export function lockupBox(l: Lockup) {
  mctx ??= document.createElement("canvas").getContext("2d")!;
  mctx.font = FONT(l.size);
  const lines = l.text.split("\n");
  const w = Math.max(...lines.map((t) => mctx!.measureText(t).width));
  return { w: w + l.size * 0.6, h: l.size * (lines.length * 1.0 + 0.45) };
}

export function drawLockup(ctx: CanvasRenderingContext2D, l: Lockup, pen: Pen, p: number) {
  if (p <= 0) return;
  const b = lockupBox(l);
  ctx.save();
  ctx.translate(l.x, l.y);
  if (l.box) {
    ctx.fillStyle = fillOf(pen, "cream");
    ctx.strokeStyle = pen.pal.ink;
    ctx.lineWidth = pen.lw * 0.6;
    ctx.fillRect(0, 0, b.w * Math.min(1, p * 2), b.h);
    ctx.strokeRect(0, 0, b.w * Math.min(1, p * 2), b.h);
  }
  ctx.globalAlpha = Math.min(1, Math.max(0, p * 2 - 0.6));
  ctx.font = FONT(l.size);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = pen.pal.ink;
  ctx.strokeStyle = pen.pal.ink;
  ctx.lineWidth = l.size * 0.035;
  ctx.lineJoin = "round";
  l.text.split("\n").forEach((t, i) => {
    const y = l.size * (0.98 + i * 1.0);
    ctx.strokeText(t, l.size * 0.3, y);
    ctx.fillText(t, l.size * 0.3, y);
  });
  ctx.restore();
}
