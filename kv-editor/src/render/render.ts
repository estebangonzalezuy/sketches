import { TEXT_FONTS } from '../fonts';
import type { Composition, ImageLayer, Layer, TextLayer, Token } from '../model';
import { RasterCache, type Rect } from './ink';
import { hexToRgb, mulberry32, vnoise } from './noise';
import { drawLockup, drawShape, fillTracked, lockupBounds, shapeBounds } from './shapes';
import { drawHeadline, headlineBounds } from './type';

export interface RenderOpts {
  /** device px per comp px */
  scale: number;
  /** layer ids to skip (e.g. while editing text inline) */
  hide?: Set<string>;
}

/**
 * The one render. Preview, PNG export and any future MP4 frame all call this.
 * Deterministic: everything random is seeded from the composition or the layer id.
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
    if (!l.visible || o.hide?.has(l.id)) continue;
    drawLayer(ctx, l, c, s, col);
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
        const ax = snapPx(l.x + x1 * l.w, s) + half;
        const ay = snapPx(l.y + y1 * l.h, s) + half;
        const bx = snapPx(l.x + x2 * l.w, s) + half;
        const by = snapPx(l.y + y2 * l.h, s) + half;
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
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

const snapPx = (v: number, s: number) => Math.round(v * s) / s;

export function bracketPath(ctx: CanvasRenderingContext2D, l: Extract<Layer, { type: 'bracket' }>) {
  const { x, y, w, h } = l;
  const bh = Math.min(l.barH, h);
  const lw = Math.min(l.legW, w);
  const top = l.corner === 'ne' || l.corner === 'nw';
  const right = l.corner === 'ne' || l.corner === 'se';
  ctx.rect(x, top ? y : y + h - bh, w, bh);
  ctx.rect(right ? x + w - lw : x, y, lw, h);
}

// ---------------------------------------------------------------- paper

const paperCache = new RasterCache<HTMLCanvasElement>(6);

function drawPaper(ctx: CanvasRenderingContext2D, c: Composition, s: number) {
  const color = c.palette[c.paper.fill];
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  if (c.paper.grain <= 0 && c.paper.mottle <= 0) return;
  const key = JSON.stringify([c.width, c.height, s, c.paper, color]);
  const cv = paperCache.get(key, () => {
    // grain tile at device resolution, capped for speed; mottle is low-frequency
    const W = Math.ceil(c.width * s);
    const H = Math.ceil(c.height * s);
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const g = out.getContext('2d')!;
    const img = g.createImageData(W, H);
    const d = img.data;
    const rnd = mulberry32(c.paper.seed);
    const [r, gg, b] = hexToRgb(color);
    const gA = c.paper.grain * 9;
    const mA = c.paper.mottle * 7;
    const mf = 1 / (90 * s);
    const seed = c.paper.seed;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const n = (rnd() - 0.5) * 2 * gA + (vnoise(x * mf, y * mf, seed) - 0.5) * 2 * mA;
        d[i] = r + n;
        d[i + 1] = gg + n;
        d[i + 2] = b + n * 0.7;
        d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return out;
  });
  ctx.drawImage(cv, 0, 0, c.width, c.height);
}

function drawCrosses(ctx: CanvasRenderingContext2D, c: Composition, s: number) {
  const k = c.crosses;
  ctx.save();
  ctx.strokeStyle = c.palette[k.stroke];
  ctx.lineWidth = Math.max(1 / s, k.weight);
  ctx.beginPath();
  const half = 0.5 / s;
  k.xs.forEach((fx, i) => {
    k.ys.forEach((fy, j) => {
      const edge = i === 0 || j === 0 || i === k.xs.length - 1 || j === k.ys.length - 1;
      if (k.mode === 'perimeter' && !edge) return;
      const x = snapPx(fx * c.width, s) + half;
      const y = snapPx(fy * c.height, s) + half;
      ctx.moveTo(x - k.size, y);
      ctx.lineTo(x + k.size, y);
      ctx.moveTo(x, y - k.size);
      ctx.lineTo(x, y + k.size);
    });
  });
  ctx.stroke();
  ctx.restore();
}

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

function drawText(ctx: CanvasRenderingContext2D, l: TextLayer, color: string) {
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

// ---------------------------------------------------------------- images

const images = new Map<string, HTMLImageElement>();
let onImageLoad: (() => void) | null = null;
export function setImageLoadListener(fn: () => void) {
  onImageLoad = fn;
}

function getImage(src: string): HTMLImageElement | null {
  let im = images.get(src);
  if (!im) {
    im = new Image();
    im.onload = () => onImageLoad?.();
    im.src = src;
    images.set(src, im);
  }
  return im.complete && im.naturalWidth ? im : null;
}

const imgCache = new RasterCache<HTMLCanvasElement>(20);

function drawImageLayer(ctx: CanvasRenderingContext2D, l: ImageLayer, c: Composition, s: number, col: (t: Token) => string) {
  const im = getImage(l.src);
  if (!im) return;
  if (!l.tint && !l.pixel) {
    ctx.drawImage(im, l.x, l.y, l.w, l.h);
    return;
  }
  const key = JSON.stringify([l.src.length, l.src.slice(-64), l.w, l.h, l.tint, l.pixel, s, l.tint ? col(l.tint) : '', c.width]);
  const cv = imgCache.get(key, () => {
    const W = Math.max(1, Math.round(l.w * s));
    const H = Math.max(1, Math.round(l.h * s));
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const g = out.getContext('2d')!;
    if (l.pixel > 0) {
      const cell = Math.max(2, Math.round((l.pixel * c.width) / 1080)) * s;
      const sw = Math.max(1, Math.round(W / cell));
      const sh = Math.max(1, Math.round(H / cell));
      const small = document.createElement('canvas');
      small.width = sw;
      small.height = sh;
      const sg = small.getContext('2d')!;
      sg.drawImage(im, 0, 0, sw, sh);
      g.imageSmoothingEnabled = false;
      g.drawImage(small, 0, 0, W, H);
    } else {
      g.drawImage(im, 0, 0, W, H);
    }
    if (l.tint) {
      // hard silhouette from alpha
      const img = g.getImageData(0, 0, W, H);
      const [r, gg, b] = hexToRgb(col(l.tint));
      for (let i = 0; i < img.data.length; i += 4) {
        const a = img.data[i + 3] >= 128 ? 255 : 0;
        img.data[i] = r;
        img.data[i + 1] = gg;
        img.data[i + 2] = b;
        img.data[i + 3] = a;
      }
      g.putImageData(img, 0, 0);
    }
    return out;
  });
  ctx.drawImage(cv, l.x, l.y, l.w, l.h);
}

// ---------------------------------------------------------------- bounds

export function layerBounds(l: Layer): Rect {
  switch (l.type) {
    case 'block':
    case 'bracket':
    case 'grid':
    case 'image':
      return { x: l.x, y: l.y, w: l.w, h: l.h };
    case 'headline':
      return headlineBounds(l);
    case 'text':
      return textBounds(l);
    case 'shape':
      return shapeBounds(l);
    case 'lockup':
      return lockupBounds(l);
  }
}
