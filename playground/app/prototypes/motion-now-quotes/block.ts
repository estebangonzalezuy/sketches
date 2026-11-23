/** One quote block: attribution on top, then the text typed word by word with an optional keyword highlight. */
import { font } from "@/lib/tmsc/fonts";
import { alpha, type Palette } from "@/lib/tmsc/palettes";
import { attribution } from "./quotes";
import type { Quote } from "./types";

type Ctx = CanvasRenderingContext2D;
type Word = { text: string; x: number; line: number; start: number; key: boolean };
export type BlockLayout = { words: Word[]; lines: number; size: number; height: number; weight: number };

const LINE = 1.12;
const clean = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export function layoutBlock(ctx: Ctx, q: Quote, maxW: number, size: number, weight = 500): BlockLayout {
  ctx.font = font(size, weight);
  const space = ctx.measureText(" ").width;
  const key = q.keyword ? clean(q.keyword) : "";
  let keyUsed = false;
  const words: Word[] = [];
  let line = 0;
  let x = 0;
  let index = 0;
  for (const part of q.text.split(" ")) {
    const w = ctx.measureText(part).width;
    if (x > 0 && x + w > maxW) {
      line++;
      x = 0;
    }
    const isKey = !keyUsed && key !== "" && clean(part) === key;
    if (isKey) keyUsed = true;
    words.push({ text: part, x, line, start: index, key: isKey });
    x += w + space;
    index += part.length + 1;
  }
  const lines = line + 1;
  const height = size * 0.75 + size * 0.5 + lines * size * LINE;
  return { words, lines, size, height, weight };
}

/** Draws at (x, y) = top-left. `typed` = characters shown so far. */
export function drawBlock(ctx: Ctx, x: number, y: number, q: Quote, l: BlockLayout, typed: number, pal: Palette, opts: { highlight: boolean; cursor: boolean; opacity: number }) {
  const { size } = l;
  const a = opts.opacity;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = font(size * 0.5, 600);
  ctx.fillStyle = alpha(pal.fg, 0.7 * a);
  ctx.fillText(attribution(q), x, y + size * 0.5);

  const top = y + size * 0.75 + size * 0.5;
  const asc = size * 0.82;
  let end = { x, y: top + asc };
  ctx.font = font(size, l.weight);
  for (const w of l.words) {
    const shown = Math.max(0, Math.min(w.text.length, typed - w.start));
    if (shown <= 0) break;
    const part = w.text.slice(0, shown);
    const wx = x + w.x;
    const by = top + w.line * size * LINE + asc;
    const pw = ctx.measureText(part).width;
    if (w.key && opts.highlight) {
      // keyword: a flat accent block with the text knocked out of it
      ctx.fillStyle = alpha(pal.accent, a);
      ctx.fillRect(wx - size * 0.08, by - asc * 0.98, pw + size * 0.16, size * 1.06);
      ctx.fillStyle = alpha(pal.bg, a);
    } else ctx.fillStyle = alpha(pal.fg, a);
    ctx.fillText(part, wx, by);
    end = { x: wx + pw, y: by };
  }
  if (opts.cursor) {
    ctx.fillStyle = alpha(pal.accent, a);
    ctx.fillRect(end.x + size * 0.08, end.y - asc * 0.92, size * 0.42, size * 0.98);
  }
}
