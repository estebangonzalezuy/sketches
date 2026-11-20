import type { LayerFx } from "@/lib/kv/render/render";
import type { Box } from "./types";

/** The running sum of everything that animates one layer in one frame. */
export type Channels = { dx: number; dy: number; scale: number; rotate: number; alpha: number; pixel: number; clip: Box | null };

export const restChannels = (): Channels => ({ dx: 0, dy: 0, scale: 1, rotate: 0, alpha: 1, pixel: 0, clip: null });

export function intersect(a: Box | null, b: Box): Box {
  if (!a) return b;
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x;
  const h = Math.min(a.y + a.h, b.y + b.h) - y;
  return { x, y, w: Math.max(0, w), h: Math.max(0, h) };
}

const EPS = 1e-4;

/** Channels → render fx, or null when the layer sits exactly at rest (drawn as the static poster). */
export function toFx(c: Channels): LayerFx | null {
  const fx: LayerFx = {};
  if (Math.abs(c.dx) > EPS) fx.dx = c.dx;
  if (Math.abs(c.dy) > EPS) fx.dy = c.dy;
  if (Math.abs(c.scale - 1) > EPS) fx.scale = Math.max(0, c.scale);
  if (Math.abs(c.rotate) > EPS) fx.rotate = c.rotate;
  if (c.alpha < 1 - EPS) fx.alpha = Math.max(0, c.alpha);
  if (c.pixel >= 2) fx.pixel = Math.round(c.pixel);
  if (c.clip) fx.clip = c.clip;
  return Object.keys(fx).length ? fx : null;
}
