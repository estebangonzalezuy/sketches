/** One quote per card, in big condensed type. Typing runs on the same clock as the feed. */
import { font } from "@/lib/tmsc/fonts";
import { alpha, palette } from "@/lib/tmsc/palettes";
import { drawBlock, layoutBlock } from "./block";
import type { Quote } from "./types";

export type CardOptions = { palette: string; speed: number; highlight: boolean; fontSize: number };

/** Seconds a card takes to type out, plus a hold at the end. */
export const cardDuration = (q: Quote, msPerChar: number) => (q.text.length * msPerChar) / 1000 + 1.8;

export function drawQuoteCard(ctx: CanvasRenderingContext2D, w: number, h: number, q: Quote, t: number, o: CardOptions, index: number, total: number) {
  const pal = palette(o.palette);
  const base = Math.min(w, h);
  const pad = base * 0.075;
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, w, h);

  const boxW = w - pad * 2;
  const boxH = h - pad * 3.2;
  let size = base * 0.14 * o.fontSize;
  let layout = layoutBlock(ctx, q, boxW, size, 700);
  while (layout.height > boxH && size > base * 0.03) {
    size *= 0.94;
    layout = layoutBlock(ctx, q, boxW, size, 700);
  }
  const typed = Math.min(q.text.length, Math.floor((t * 1000) / o.speed));
  const typing = typed < q.text.length;
  drawBlock(ctx, pad, pad, q, layout, typed, pal, { highlight: o.highlight, cursor: typing && Math.floor(t * 2.5) % 2 === 0, opacity: 1 });

  const fs = base * 0.026;
  ctx.font = font(fs, 500);
  ctx.fillStyle = alpha(pal.fg, 0.8);
  ctx.textAlign = "left";
  ctx.fillText("tMSC: Motion, Now 2026 · Example data", pad, h - pad * 0.8);
  ctx.textAlign = "right";
  ctx.fillText(`${index + 1}/${total}`, w - pad, h - pad * 0.8);
  ctx.textAlign = "left";
}
