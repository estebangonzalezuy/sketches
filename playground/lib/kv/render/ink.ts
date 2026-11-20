import { boxBlur, hexToRgb, vnoise } from './noise';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InkOpts {
  /** output scale (device px per comp px) */
  scale: number;
  /** corner softening radius, comp px */
  softPx: number;
  /** edge wobble 0–1 */
  rough: number;
  /** wobble feature size, comp px */
  roughScale: number;
  seed: number;
  color: string;
}

export interface InkResult {
  canvas: HTMLCanvasElement;
  /** where to draw it, comp px */
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Printed-ink pass: draws a mask, softens corners (blur) and re-thresholds it against seeded
 * noise so edges wobble a little like the riso/letterpress edges of the master KV.
 * Output is one flat colour with a ~1 px anti-aliased edge. Same call in preview and export.
 */
export function inkify(bounds: Rect, draw: (ctx: CanvasRenderingContext2D) => void, o: InkOpts): InkResult {
  const s = o.scale;
  const pad = Math.ceil(o.softPx * 2 + 6);
  const x0 = Math.floor(bounds.x - pad);
  const y0 = Math.floor(bounds.y - pad);
  const wC = Math.ceil(bounds.w + pad * 2);
  const hC = Math.ceil(bounds.h + pad * 2);
  const W = Math.max(1, Math.ceil(wC * s));
  const H = Math.max(1, Math.ceil(hC * s));
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.setTransform(s, 0, 0, s, -x0 * s, -y0 * s);
  ctx.fillStyle = '#000';
  draw(ctx);
  const [r, g, b] = hexToRgb(o.color);
  const r0 = o.softPx * s;
  if (r0 < 0.5 && o.rough <= 0.001) {
    // nothing to process: recolour only
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = o.color;
    ctx.fillRect(0, 0, W, H);
    return { canvas: cv, x: x0, y: y0, w: W / s, h: H / s };
  }
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const A = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) A[i] = d[i * 4 + 3] / 255;
  if (r0 >= 0.5) boxBlur(A, W, H, r0 / 1.7, 3);
  const k = Math.max(1, r0 * 1.6);
  const fs = 1 / Math.max(1, o.roughScale * s);
  const fs2 = fs * 3.1;
  const amp = o.rough * 0.22;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const a = A[i];
      if (a <= 0.001 || a >= 0.999) {
        if (a >= 0.999) {
          d[i * 4] = r;
          d[i * 4 + 1] = g;
          d[i * 4 + 2] = b;
          d[i * 4 + 3] = 255;
        } else d[i * 4 + 3] = 0;
        continue;
      }
      let t = 0.5;
      if (amp > 0) {
        const gx = x + x0 * s;
        const gy = y + y0 * s;
        const n = vnoise(gx * fs, gy * fs, o.seed) * 0.7 + vnoise(gx * fs2, gy * fs2, o.seed + 7) * 0.3;
        t += (n - 0.5) * 2 * amp;
      }
      const v = Math.min(1, Math.max(0, (a - t) * k + 0.5));
      d[i * 4] = r;
      d[i * 4 + 1] = g;
      d[i * 4 + 2] = b;
      d[i * 4 + 3] = Math.round(v * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return { canvas: cv, x: x0, y: y0, w: W / s, h: H / s };
}

/** Bounded cache for raster results. */
export class RasterCache<T> {
  private map = new Map<string, T>();
  constructor(private max = 60) {}
  get(key: string, make: () => T): T {
    const hit = this.map.get(key);
    if (hit) {
      this.map.delete(key);
      this.map.set(key, hit);
      return hit;
    }
    const v = make();
    this.map.set(key, v);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value as string);
    return v;
  }
  clear() {
    this.map.clear();
  }
}
