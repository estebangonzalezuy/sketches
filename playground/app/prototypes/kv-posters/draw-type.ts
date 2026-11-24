import { DEFAULT_TYPE, type HeadlineLayer } from "@/lib/kv/model";
import { drawHeadline as drawKvHeadline, tracePath, typeGeometry } from "@/lib/kv/render/type";
import { fillOf, type Pen } from "./draw-shapes";
import type { Headline, Lockup } from "./types";

/**
 * Headlines use the KV type treatment from lib/kv (the same as the Studio's Letters cell):
 * Archivo Narrow Bold outlines, octagonal facets, keyhole notches in tall counters, round dots
 * and the printed-ink edge.
 */
function kvLayer(h: Pick<Headline, "id" | "text" | "size">, x = 0, y = 0): HeadlineLayer {
  return { ...DEFAULT_TYPE, id: h.id, type: "headline", name: "", visible: true, locked: false, text: h.text, x, y, size: h.size, font: "narrow", tracking: -0.01, leading: 0.88, fill: "ink" };
}

const pad = (size: number) => size * 0.08;

/** Ink box of the headline relative to its anchor (first baseline). */
const inkBox = (h: Pick<Headline, "id" | "text" | "size">) => typeGeometry(kvLayer(h)).bbox;

/** Box size of a headline (horizontal), padding included. */
export function headlineBox(text: string, size: number) {
  const b = inkBox({ id: "m", text, size });
  return { w: b.w + 2 * pad(size), h: b.h + 2 * pad(size) };
}

export function drawHeadline(ctx: CanvasRenderingContext2D, h: Headline, pen: Pen, p: number) {
  if (p <= 0) return;
  const ink = inkBox(h);
  const b = { w: ink.w + 2 * pad(h.size), h: ink.h + 2 * pad(h.size) };
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
  // the reveal moves the whole context so the inked raster stays cached at a fixed position
  ctx.translate(0, (1 - k) * b.h);
  const layer = kvLayer(h, Math.round(pad(h.size) - ink.x), Math.round(pad(h.size) - ink.y));
  const color = pen.pal[h.fill ?? "ink"];
  if (pen.line || h.outline) {
    ctx.beginPath();
    tracePath(ctx, typeGeometry(layer).contours, layer.x, layer.y);
    if (pen.line) {
      ctx.fillStyle = pen.pal.paper;
      ctx.fill("nonzero");
    }
    ctx.strokeStyle = pen.line ? pen.pal.ink : color;
    ctx.lineWidth = pen.lw * 1.1;
    ctx.lineJoin = "round";
    ctx.stroke();
  } else {
    drawKvHeadline(ctx, layer, { scale: pen.scale, compWidth: 1080, color: () => color });
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
  const color = pen.pal[l.fill ?? "ink"];
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineJoin = "round";
  ctx.lineWidth = l.outline ? Math.max(1, l.size * 0.03) : l.size * 0.035;
  l.text.split("\n").forEach((t, i) => {
    const y = l.size * (0.98 + i * 1.0);
    ctx.strokeText(t, l.size * 0.3, y);
    if (!l.outline) ctx.fillText(t, l.size * 0.3, y);
  });
  ctx.restore();
}
