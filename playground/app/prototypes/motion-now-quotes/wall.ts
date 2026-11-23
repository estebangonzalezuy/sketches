/** The masonry wall: live typing feed or static wall. Blocks glide when the layout reflows and fade when dropped. */
import { approach, power3Out, segment } from "@/lib/tmsc/ease";
import { font } from "@/lib/tmsc/fonts";
import { alpha, palette } from "@/lib/tmsc/palettes";
import { drawBlock, layoutBlock, type BlockLayout } from "./block";
import { WALL_STAGGER, type QuoteMode } from "./data";
import { feedAt } from "./quotes";
import type { LiveQuote, Quote } from "./types";

type Ctx = CanvasRenderingContext2D;
export type WallOptions = { mode: QuoteMode; palette: string; speed: number; max: number; fontSize: number; highlight: boolean };
type Placed = LiveQuote & { x: number; y: number; layout: BlockLayout };
type Shown = { x: number; y: number; fade: number; last: Placed };

/** Per-viewer motion memory: where each block was drawn last frame. */
export class WallMotion {
  shown = new Map<number, Shown>();
  layouts = new Map<string, BlockLayout>();
}

function masonry(ctx: Ctx, items: LiveQuote[], m: WallMotion, cols: number, colW: number, gap: number, x0: number, y0: number, size: number): { placed: Placed[]; bottom: number } {
  const heights = new Array<number>(cols).fill(y0);
  // metrics change once the web font loads, so they are part of the cache key
  ctx.font = font(size, 500);
  const sig = Math.round(ctx.measureText("Motion, now").width);
  const placed: Placed[] = items.map((it) => {
    const id = `${it.quote.text}|${colW}|${size}|${sig}`;
    let layout = m.layouts.get(id);
    if (!layout) m.layouts.set(id, (layout = layoutBlock(ctx, it.quote, colW, size)));
    const c = heights.indexOf(Math.min(...heights));
    const p = { ...it, x: x0 + c * (colW + gap), y: heights[c], layout };
    heights[c] += layout.height + gap;
    return p;
  });
  return { placed, bottom: Math.max(...heights) - gap };
}

export function drawWall(ctx: Ctx, w: number, h: number, quotes: readonly Quote[], t: number, dt: number, o: WallOptions, m: WallMotion) {
  const pal = palette(o.palette);
  const base = Math.min(w, h);
  const pad = base * 0.06;
  const wide = w / h > 1.2;
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, w, h);

  const size = base * (wide ? 0.046 : 0.05) * o.fontSize;
  const cols = Math.max(1, Math.round((wide ? 3 : 2) / Math.min(1.25, Math.max(0.75, o.fontSize))));
  const gap = pad * 0.6;
  const colW = (w - pad * 2 - gap * (cols - 1)) / cols;
  const bottomLimit = h - pad * 1.5;

  const live = o.mode === "Live feed";
  let items: LiveQuote[] = live
    ? feedAt(quotes, t, o.speed, o.max)
    : quotes.slice(0, o.max).map((quote, k) => ({ key: k, quote, typed: quote.text.length, start: k * WALL_STAGGER }));
  let laid = masonry(ctx, items, m, cols, colW, gap, pad, pad, size);
  while (laid.bottom > bottomLimit && items.length > 1) {
    items = live ? items.slice(1) : items.slice(0, -1);
    laid = masonry(ctx, items, m, cols, colW, gap, pad, pad, size);
  }

  const k = dt <= 0 ? 1e3 : 9;
  const seen = new Set<number>();
  for (const p of laid.placed) {
    seen.add(p.key);
    const prev = m.shown.get(p.key);
    const s: Shown = prev ? { ...prev, last: p } : { x: p.x, y: p.y, fade: 1, last: p };
    s.x = approach(s.x, p.x, dt, k);
    s.y = approach(s.y, p.y, dt, k);
    m.shown.set(p.key, s);
    const appear = power3Out(segment(t, p.start, 0.35));
    const rise = (1 - appear) * size * 0.6;
    const typing = live && p.typed < p.quote.text.length;
    drawBlock(ctx, s.x, s.y + rise, p.quote, p.layout, p.typed, pal, { highlight: o.highlight, cursor: typing && Math.floor(t * 2.5) % 2 === 0, opacity: appear });
  }
  // blocks that just left the wall fade out where they were
  for (const [key, s] of m.shown) {
    if (seen.has(key)) continue;
    s.fade = dt <= 0 ? 0 : approach(s.fade, 0, dt, 8);
    if (s.fade < 0.02) m.shown.delete(key);
    else drawBlock(ctx, s.x, s.y, s.last.quote, s.last.layout, s.last.typed, pal, { highlight: o.highlight, cursor: false, opacity: s.fade });
  }

  ctx.font = font(base * 0.022, 500);
  ctx.fillStyle = alpha(pal.fg, 0.8);
  ctx.textAlign = "left";
  ctx.fillText(`tMSC: Motion, Now 2026 · Anonymous answers · Example data`, pad, h - pad * 0.6);
}
