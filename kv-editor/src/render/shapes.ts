import { TEXT_FONTS } from '../fonts';
import type { LockupLayer, ShapeLayer } from '../model';
import { inkify, RasterCache, type InkResult, type Rect } from './ink';
import { hashStr } from './noise';

/** Paths in a unit box centred on 0,0 with radius 1, y down. */
function shapePath(ctx: CanvasRenderingContext2D, l: ShapeLayer) {
  const R = 1;
  switch (l.shape) {
    case 'asterisk': {
      const n = Math.max(3, Math.round(l.arms));
      const root = l.thickness;
      const tip = l.thickness * l.flare;
      const rr = Math.min(tip * 0.28, 0.12);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const T = (x: number, y: number): [number, number] => [x * ca - y * sa, x * sa + y * ca];
        // arm with rounded tip corners
        ctx.moveTo(...T(-root / 2, 0));
        ctx.arcTo(...T(-tip / 2, -R), ...T(0, -R), rr);
        ctx.arcTo(...T(tip / 2, -R), ...T(root / 2, 0), rr);
        ctx.lineTo(...T(root / 2, 0));
        ctx.closePath();
      }
      ctx.moveTo(root * 0.6, 0);
      ctx.arc(0, 0, root * 0.6, 0, Math.PI * 2);
      break;
    }
    case 'circle':
      ctx.moveTo(R, 0);
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      break;
    case 'semicircle':
      ctx.moveTo(-R, 0.5);
      ctx.arc(0, 0.5, R, Math.PI, 0);
      ctx.closePath();
      break;
    case 'plus': {
      const t = l.thickness / 2;
      ctx.rect(-t, -R, t * 2, R * 2);
      ctx.rect(-R, -t, R * 2, t * 2);
      break;
    }
    case 'arrow': {
      const t = l.thickness / 2;
      ctx.moveTo(-R, -t);
      ctx.lineTo(R * 0.25, -t);
      ctx.lineTo(R * 0.25, -R * 0.62);
      ctx.lineTo(R, 0);
      ctx.lineTo(R * 0.25, R * 0.62);
      ctx.lineTo(R * 0.25, t);
      ctx.lineTo(-R, t);
      ctx.closePath();
      break;
    }
  }
}

export function shapeBounds(l: ShapeLayer): Rect {
  return { x: l.x - l.size, y: l.y - l.size, w: l.size * 2, h: l.size * 2 };
}

const shapeCache = new RasterCache<InkResult>(40);

export function drawShape(ctx: CanvasRenderingContext2D, l: ShapeLayer, scale: number, color: string) {
  const fx = l.x - Math.floor(l.x);
  const fy = l.y - Math.floor(l.y);
  const key = JSON.stringify([l.id, l.shape, l.size, l.rotation, l.arms, l.flare, l.thickness, l.rough, l.soft, fx, fy, scale, color]);
  const res = shapeCache.get(key, () =>
    inkify(
      { x: fx - l.size, y: fy - l.size, w: l.size * 2, h: l.size * 2 },
      (c) => {
        c.save();
        c.translate(fx, fy);
        c.rotate((l.rotation * Math.PI) / 180);
        c.scale(l.size, l.size);
        c.beginPath();
        shapePath(c, l);
        c.fill('nonzero');
        c.restore();
      },
      {
        scale,
        softPx: l.soft * l.size * 0.06,
        rough: l.rough,
        roughScale: Math.max(2, l.size * 0.03),
        seed: hashStr(l.id),
        color,
      },
    ),
  );
  ctx.drawImage(res.canvas, Math.floor(l.x) + res.x, Math.floor(l.y) + res.y, res.w, res.h);
}

// ---------------------------------------------------------------- lockup

/** Proportions measured on refs/lockup-crop.png (h = 1). */
const LK = { padL: 0.37, padR: 0.36, text: 0.775, track: -0.016 };

function lockupFont(h: number) {
  const f = TEXT_FONTS.inter600;
  return `${f.weight} ${h * LK.text}px "${f.family}"`;
}

let measureCtx: CanvasRenderingContext2D | null = null;
function textWidth(text: string, h: number) {
  measureCtx ??= document.createElement('canvas').getContext('2d')!;
  measureCtx.font = lockupFont(h);
  const w = measureCtx.measureText(text).width;
  return w + Math.max(0, [...text].length - 1) * LK.track * h * LK.text;
}

export function lockupGeometry(l: LockupLayer) {
  const h = l.h;
  return { w: h * (LK.padL + LK.padR) + textWidth(l.text, h) };
}

export function lockupBounds(l: LockupLayer): Rect {
  return { x: l.x, y: l.y, w: lockupGeometry(l).w, h: l.h };
}

export function drawLockup(ctx: CanvasRenderingContext2D, l: LockupLayer, color: (t: LockupLayer['c2']) => string, ink: string) {
  const g = lockupGeometry(l);
  const h = l.h;
  ctx.save();
  ctx.fillStyle = color(l.c2);
  ctx.fillRect(l.x, l.y, g.w, h);
  // wordmark: clean, never pixelated
  ctx.fillStyle = ink;
  ctx.font = lockupFont(h);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  fillTracked(ctx, l.text, l.x + h * LK.padL, l.y + h * 0.5 + h * LK.text * 0.727 * 0.5, LK.track * h * LK.text);
  ctx.restore();
}

/** letterSpacing where the canvas supports it, glyph-by-glyph otherwise. */
export function fillTracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, track: number) {
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ('letterSpacing' in c) {
    const prev = c.letterSpacing;
    c.letterSpacing = `${track}px`;
    ctx.fillText(text, x, y);
    c.letterSpacing = prev;
    return;
  }
  let pen = x;
  for (const ch of text) {
    ctx.fillText(ch, pen, y);
    pen += ctx.measureText(ch).width + track;
  }
}
