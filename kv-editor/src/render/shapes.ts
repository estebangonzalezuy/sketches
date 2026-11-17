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
    case 'ghost':
      ghostPath(ctx, 0, 0, 1);
      break;
    case 'badge':
      break;
  }
}

/** The outline "ghost / bell" icon of the lockup's pink module. Unit radius, centred. */
export function ghostPath(ctx: CanvasRenderingContext2D | Path2D, cx: number, cy: number, r: number) {
  const P = (x: number, y: number): [number, number] => [cx + x * r, cy + y * r];
  ctx.moveTo(...P(-0.4, -0.12));
  ctx.bezierCurveTo(...P(-0.5, -1.05), ...P(0.5, -1.05), ...P(0.4, -0.12));
  ctx.bezierCurveTo(...P(0.6, -0.06), ...P(0.9, 0.04), ...P(1.0, 0.2));
  ctx.bezierCurveTo(...P(0.82, 0.3), ...P(0.64, 0.36), ...P(0.6, 0.52));
  ctx.lineTo(...P(0.6, 0.84));
  ctx.quadraticCurveTo(...P(0, 1.0), ...P(-0.6, 0.84));
  ctx.lineTo(...P(-0.6, 0.52));
  ctx.bezierCurveTo(...P(-0.64, 0.36), ...P(-0.82, 0.3), ...P(-1.0, 0.2));
  ctx.bezierCurveTo(...P(-0.9, 0.04), ...P(-0.6, -0.06), ...P(-0.4, -0.12));
  ctx.closePath();
}

/** The circular "M" mark with its ring broken at the bottom. */
export function drawBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  const sw = r * 0.26;
  const gap = 0.16;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = sw;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.arc(cx, cy, r - sw / 2, Math.PI / 2 + gap, Math.PI / 2 - gap + Math.PI * 2);
  ctx.stroke();
  // short stem closing the break, as in the crop
  ctx.fillRect(cx - sw * 0.28, cy + r - sw * 1.75, sw * 0.56, sw * 1.75);
  const f = TEXT_FONTS.inter600;
  ctx.font = `${f.weight} ${r * 1.12}px "${f.family}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = r * 0.07;
  ctx.lineJoin = 'miter';
  ctx.strokeText('M', cx, cy + r * 0.4);
  ctx.fillText('M', cx, cy + r * 0.4);
  ctx.restore();
}

export function shapeBounds(l: ShapeLayer): Rect {
  return { x: l.x - l.size, y: l.y - l.size, w: l.size * 2, h: l.size * 2 };
}

const shapeCache = new RasterCache<InkResult>(40);

export function drawShape(ctx: CanvasRenderingContext2D, l: ShapeLayer, scale: number, color: string) {
  if (l.shape === 'badge') {
    drawBadge(ctx, l.x, l.y, l.size, color);
    return;
  }
  if (l.shape === 'ghost') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = l.size * l.thickness * 0.35;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ghostPath(ctx, l.x, l.y, l.size);
    ctx.stroke();
    ctx.restore();
    return;
  }
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
const LK = { sq1: 1.045, padL: 0.37, padR: 0.36, sq3: 1.08, text: 0.775, track: -0.016 };

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
  const w1 = l.badge === false ? 0 : h * LK.sq1;
  const w2 = h * (LK.padL + LK.padR) + textWidth(l.text, h);
  const w3 = l.icon === false ? 0 : h * LK.sq3;
  return { w1, w2, w3, w: w1 + w2 + w3 };
}

export function lockupBounds(l: LockupLayer): Rect {
  return { x: l.x, y: l.y, w: lockupGeometry(l).w, h: l.h };
}

export function drawLockup(ctx: CanvasRenderingContext2D, l: LockupLayer, color: (t: LockupLayer['c1']) => string, ink: string) {
  const g = lockupGeometry(l);
  const h = l.h;
  ctx.save();
  ctx.fillStyle = color(l.c1);
  ctx.fillRect(l.x, l.y, g.w1, h);
  ctx.fillStyle = color(l.c2);
  ctx.fillRect(l.x + g.w1, l.y, g.w2, h);
  ctx.fillStyle = color(l.c3);
  ctx.fillRect(l.x + g.w1 + g.w2, l.y, g.w3, h);
  if (g.w1 > 0) drawBadge(ctx, l.x + g.w1 / 2, l.y + h / 2, h * 0.33, ink);
  // wordmark: clean, never pixelated
  ctx.fillStyle = ink;
  ctx.font = lockupFont(h);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const tx = l.x + g.w1 + h * LK.padL;
  const ty = l.y + h * 0.5 + h * LK.text * 0.727 * 0.5;
  fillTracked(ctx, l.text, tx, ty, LK.track * h * LK.text);
  if (g.w3 > 0) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = h * 0.06;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ghostPath(ctx, l.x + g.w1 + g.w2 + g.w3 / 2, l.y + h * 0.47, h * 0.33);
    ctx.stroke();
  }
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
