import type { Composition } from '../model';
import { RasterCache } from './ink';
import { hexToRgb, mulberry32, vnoise } from './noise';

export const snapPx = (v: number, s: number) => Math.round(v * s) / s;

// ---------------------------------------------------------------- paper

const paperCache = new RasterCache<HTMLCanvasElement>(6);

export function drawPaper(ctx: CanvasRenderingContext2D, c: Composition, s: number) {
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

export function drawCrosses(ctx: CanvasRenderingContext2D, c: Composition, s: number) {
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

