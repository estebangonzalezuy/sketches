import type { BracketLayer, Composition, Layer, Token } from '../model';
import { drawWithFx, isHidden, type LayerFx } from './fx';
import { drawImageLayer } from './image';
import { drawCrosses, drawPaper, snapPx } from './paper';
import { drawLockup, drawShape } from './shapes';
import { drawText } from './text';
import { drawHeadline } from './type';

export { layerBounds } from './bounds';
export { setImageLoadListener } from './image';
export type { LayerFx } from './fx';

export interface RenderOpts {
  /** device px per comp px */
  scale: number;
  /** layer ids to skip */
  hide?: Set<string>;
  /** per-layer animation effects, keyed by layer id */
  fx?: Map<string, LayerFx>;
}

/**
 * The one render. Preview, PNG and every MP4 frame call this.
 * Deterministic: everything random is seeded from the composition or the layer id.
 * Ported from the KV Editor (kv-editor/src/render/render.ts); video/GIF layers are skipped.
 */
export function render(ctx: CanvasRenderingContext2D, c: Composition, o: RenderOpts) {
  const s = o.scale;
  const col = (t: Token) => c.palette[t] ?? '#ff00ff';
  ctx.save();
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.imageSmoothingEnabled = true;
  drawPaper(ctx, c, s);
  if (c.crosses.visible) drawCrosses(ctx, c, s);
  for (const l of c.layers) {
    if (!l.visible || l.type === 'media' || o.hide?.has(l.id)) continue;
    const fx = o.fx?.get(l.id);
    if (!fx) drawLayer(ctx, l, c, s, col);
    else if (!isHidden(fx)) drawWithFx(ctx, l, c, s, fx, (g) => drawLayer(g, l, c, s, col));
  }
  ctx.restore();
}

function drawLayer(ctx: CanvasRenderingContext2D, l: Layer, c: Composition, s: number, col: (t: Token) => string) {
  switch (l.type) {
    case 'block':
      ctx.fillStyle = col(l.fill);
      ctx.fillRect(l.x, l.y, l.w, l.h);
      break;
    case 'bracket':
      ctx.fillStyle = col(l.fill);
      ctx.beginPath();
      bracketPath(ctx, l);
      ctx.fill();
      break;
    case 'grid': {
      ctx.save();
      ctx.strokeStyle = col(l.stroke);
      ctx.lineWidth = Math.max(1 / s, l.weight);
      ctx.lineCap = 'butt';
      ctx.beginPath();
      const half = (ctx.lineWidth * s) % 2 >= 0.5 && (ctx.lineWidth * s) % 2 < 1.5 ? 0.5 / s : 0;
      for (const [x1, y1, x2, y2] of l.lines) {
        ctx.moveTo(snapPx(l.x + x1 * l.w, s) + half, snapPx(l.y + y1 * l.h, s) + half);
        ctx.lineTo(snapPx(l.x + x2 * l.w, s) + half, snapPx(l.y + y2 * l.h, s) + half);
      }
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'headline':
      drawHeadline(ctx, l, { scale: s, compWidth: c.width, color: col });
      break;
    case 'text':
      drawText(ctx, l, col(l.fill));
      break;
    case 'shape':
      drawShape(ctx, l, s, col(l.fill));
      break;
    case 'lockup':
      drawLockup(ctx, l, col, col('ink'));
      break;
    case 'image':
      drawImageLayer(ctx, l, c, s, col);
      break;
  }
}

export function bracketPath(ctx: CanvasRenderingContext2D, l: BracketLayer) {
  const { x, y, w, h } = l;
  const bh = Math.min(l.barH, h);
  const lw = Math.min(l.legW, w);
  const top = l.corner === 'ne' || l.corner === 'nw';
  const right = l.corner === 'ne' || l.corner === 'se';
  ctx.rect(x, top ? y : y + h - bh, w, bh);
  ctx.rect(right ? x + w - lw : x, y, lw, h);
}
