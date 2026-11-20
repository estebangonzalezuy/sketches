import { TEXT_FONTS } from '../fonts';
import type { TextLayer } from '../model';
import type { Rect } from './ink';
import { fillTracked } from './shapes';

// ---------------------------------------------------------------- text

let mctx: CanvasRenderingContext2D | null = null;
function textCtx() {
  return (mctx ??= document.createElement('canvas').getContext('2d')!);
}

export function textFont(l: TextLayer) {
  const f = TEXT_FONTS[l.font];
  return `${f.weight} ${l.size}px "${f.family}"`;
}

export function textBounds(l: TextLayer): Rect {
  const m = textCtx();
  m.font = textFont(l);
  const lines = l.text.split('\n');
  let w = 0;
  for (const line of lines) w = Math.max(w, m.measureText(line).width + Math.max(0, [...line].length - 1) * l.tracking * l.size);
  const h = l.size * (1 + (lines.length - 1) * l.leading);
  const x = l.align === 'center' ? l.x - w / 2 : l.align === 'right' ? l.x - w : l.x;
  return { x, y: l.y, w, h };
}

export function drawText(ctx: CanvasRenderingContext2D, l: TextLayer, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = textFont(l);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const b = textBounds(l);
  l.text.split('\n').forEach((line, i) => {
    const lw = ctx.measureText(line).width + Math.max(0, [...line].length - 1) * l.tracking * l.size;
    const x = l.align === 'center' ? l.x - lw / 2 : l.align === 'right' ? l.x - lw : l.x;
    fillTracked(ctx, line, x, b.y + l.size * 0.8 + i * l.leading * l.size, l.tracking * l.size);
  });
  ctx.restore();
}

