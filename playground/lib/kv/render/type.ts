import type { HeadlineLayer, TypeStyle } from '../model';
import { inkify, RasterCache, type InkResult, type Rect } from './ink';
import { hashStr } from './noise';
import { tracePath, typeGeometry, type TypeGeometry } from './type-geometry';

export { tracePath, typeGeometry, type Pt, type TypeGeometry } from './type-geometry';


const rasterCache = new RasterCache<InkResult>(80);

export interface DrawCtx {
  scale: number;
  compWidth: number;
  color: (t: TypeStyle['fill']) => string;
}

export function headlineBounds(l: HeadlineLayer): Rect {
  const g = typeGeometry(l);
  return { x: l.x + g.bbox.x, y: l.y + g.bbox.y, w: g.bbox.w, h: g.bbox.h };
}

export function drawHeadline(ctx: CanvasRenderingContext2D, l: HeadlineLayer, dc: DrawCtx) {
  const g = typeGeometry(l);
  if (!g.contours.length) return;
  const color = dc.color(l.fill);
  if (l.treatment === 'clean') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    tracePath(ctx, g.contours, l.x, l.y);
    ctx.fill('nonzero');
    ctx.restore();
    return;
  }
  const b = headlineBounds(l);
  if (l.treatment === 'pixel') {
    const key = JSON.stringify(['px', l.text, l.font, l.size, l.scaleX, l.tracking, l.leading, l.align, l.cell, l.x, l.y, dc.compWidth, dc.scale, color]);
    const res = rasterCache.get(key, () => pixelate(g, l, b, dc, color));
    ctx.drawImage(res.canvas, res.x, res.y, res.w, res.h);
    return;
  }
  // KV treatment. Cache is keyed on the fractional position so the noise stays glued to the type
  // when it moves by whole pixels and the draw stays pixel-aligned.
  const fx = l.x - Math.floor(l.x);
  const fy = l.y - Math.floor(l.y);
  const key = JSON.stringify(['kv', l.id, l.text, l.font, l.size, l.scaleX, l.tracking, l.leading, l.align, l.chamfer, l.notches, l.notchW, l.notchD, l.rough, l.soft, fx, fy, dc.scale, color]);
  const res = rasterCache.get(key, () =>
    inkify(
      { x: fx + g.bbox.x, y: fy + g.bbox.y, w: g.bbox.w, h: g.bbox.h },
      (c) => {
        c.beginPath();
        tracePath(c, g.contours, fx, fy);
        c.fill('nonzero');
        if (g.notches.length) {
          c.globalCompositeOperation = 'destination-out';
          for (const n of g.notches) c.fillRect(n.x + fx, n.y + fy, n.w, n.h);
          c.globalCompositeOperation = 'source-over';
        }
      },
      {
        scale: dc.scale,
        softPx: l.soft * l.size * 0.016,
        rough: l.rough,
        roughScale: Math.max(2, l.size * 0.012),
        seed: hashStr(l.id),
        color,
      },
    ),
  );
  ctx.drawImage(res.canvas, Math.floor(l.x) + res.x, Math.floor(l.y) + res.y, res.w, res.h);
}

/** tMSC level-2 pixel: raster, sample cell centres on the global grid, hard squares. */
function pixelate(g: TypeGeometry, l: HeadlineLayer, b: Rect, dc: DrawCtx, color: string): InkResult {
  const cell = Math.max(2, Math.round((l.cell * dc.compWidth) / 1080));
  const s = dc.scale;
  const x0 = Math.floor((b.x - cell) / cell) * cell;
  const y0 = Math.floor((b.y - cell) / cell) * cell;
  const x1 = Math.ceil((b.x + b.w + cell) / cell) * cell;
  const y1 = Math.ceil((b.y + b.h + cell) / cell) * cell;
  const cols = (x1 - x0) / cell;
  const rows = (y1 - y0) / cell;
  // mask at 1 px per comp px is enough to read cell centres
  const hi = document.createElement('canvas');
  hi.width = x1 - x0;
  hi.height = y1 - y0;
  const hc = hi.getContext('2d', { willReadFrequently: true })!;
  hc.translate(-x0, -y0);
  hc.beginPath();
  tracePath(hc, g.contours, l.x, l.y);
  hc.fill('nonzero');
  const data = hc.getImageData(0, 0, hi.width, hi.height).data;
  const out = document.createElement('canvas');
  out.width = Math.ceil((x1 - x0) * s);
  out.height = Math.ceil((y1 - y0) * s);
  const oc = out.getContext('2d')!;
  oc.fillStyle = color;
  const cs = cell * s;
  for (let j = 0; j < rows; j++) {
    const sy = Math.min(hi.height - 1, Math.floor(j * cell + cell / 2));
    for (let i = 0; i < cols; i++) {
      const sx = Math.min(hi.width - 1, Math.floor(i * cell + cell / 2));
      if (data[(sy * hi.width + sx) * 4 + 3] >= 128) oc.fillRect(Math.round(i * cs), Math.round(j * cs), Math.ceil(cs), Math.ceil(cs));
    }
  }
  return { canvas: out, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
