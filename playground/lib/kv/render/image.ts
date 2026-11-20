import type { Composition, ImageLayer, Token } from '../model';
import { RasterCache } from './ink';
import { hexToRgb } from './noise';

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

export function drawImageLayer(ctx: CanvasRenderingContext2D, l: ImageLayer, c: Composition, s: number, col: (t: Token) => string) {
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

