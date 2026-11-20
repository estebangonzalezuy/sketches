import type { Composition, Layer } from '../model';
import { layerBounds } from './bounds';

/**
 * Per-layer effects an animation applies on top of a layer's own properties. All are
 * optional; the identity (no fx) draws the layer exactly as the static poster does.
 * Transform pivot is the centre of the layer's resting bounds.
 */
export interface LayerFx {
  /** 0–1, multiplied into globalAlpha */
  alpha?: number;
  /** visible window in resting-layer composition px (moves with the layer) */
  clip?: { x: number; y: number; w: number; h: number };
  /** offset in composition px */
  dx?: number;
  dy?: number;
  /** uniform scale around the pivot */
  scale?: number;
  /** degrees around the pivot */
  rotate?: number;
  /** tMSC pixelate: cell size in composition px (≤ 1 = off) */
  pixel?: number;
}

export const isHidden = (fx: LayerFx) =>
  (fx.alpha ?? 1) <= 0.001 || (fx.scale ?? 1) <= 0.001 || (!!fx.clip && (fx.clip.w <= 0 || fx.clip.h <= 0));

let pixCanvas: HTMLCanvasElement | null = null;

/** Sets alpha, transform and clip on `g` (already in composition space). */
function applyFx(g: CanvasRenderingContext2D, l: Layer, fx: LayerFx) {
  if (fx.alpha !== undefined) g.globalAlpha *= Math.max(0, Math.min(1, fx.alpha));
  const moved = fx.dx || fx.dy || (fx.scale ?? 1) !== 1 || fx.rotate;
  if (moved) {
    const b = layerBounds(l);
    const px = b.x + b.w / 2;
    const py = b.y + b.h / 2;
    g.translate(px + (fx.dx ?? 0), py + (fx.dy ?? 0));
    if (fx.rotate) g.rotate((fx.rotate * Math.PI) / 180);
    if ((fx.scale ?? 1) !== 1) g.scale(fx.scale!, fx.scale!);
    g.translate(-px, -py);
  }
  if (fx.clip) {
    g.beginPath();
    g.rect(fx.clip.x, fx.clip.y, fx.clip.w, fx.clip.h);
    g.clip();
  }
}

/**
 * Draws one layer through its fx. `ctx` has the composition transform (scale s) set.
 * Pixelate draws the layer into a canvas `cell` times smaller and scales it back up
 * hard-edged with a 50% alpha threshold, so cells are solid and the layer's own rasters
 * stay cached at the real scale.
 */
export function drawWithFx(
  ctx: CanvasRenderingContext2D,
  l: Layer,
  c: Composition,
  s: number,
  fx: LayerFx,
  draw: (g: CanvasRenderingContext2D) => void,
) {
  const cell = Math.round(fx.pixel ?? 0);
  if (cell <= 1) {
    ctx.save();
    applyFx(ctx, l, fx);
    draw(ctx);
    ctx.restore();
    return;
  }
  const k = 1 / cell; // one pixel of the small canvas per cell, in composition px
  const W = Math.max(1, Math.ceil(c.width * k));
  const H = Math.max(1, Math.ceil(c.height * k));
  pixCanvas ??= document.createElement('canvas');
  if (pixCanvas.width !== W || pixCanvas.height !== H) {
    pixCanvas.width = W;
    pixCanvas.height = H;
  }
  const g = pixCanvas.getContext('2d', { willReadFrequently: true })!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.clearRect(0, 0, W, H);
  g.setTransform(k, 0, 0, k, 0, 0);
  g.save();
  applyFx(g, l, { ...fx, alpha: undefined });
  draw(g);
  g.restore();
  // hard cells, like the KV's pixel type: each cell is either ink or paper, never a smudge
  const img = g.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 128 ? 255 : 0;
  g.putImageData(img, 0, 0);
  ctx.save();
  if (fx.alpha !== undefined) ctx.globalAlpha *= Math.max(0, Math.min(1, fx.alpha));
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(pixCanvas, 0, 0, W, H, 0, 0, W / k, H / k);
  ctx.restore();
}
