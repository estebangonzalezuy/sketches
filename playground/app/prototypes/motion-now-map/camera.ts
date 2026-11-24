/** A 2D camera: screen = world × s + (tx, ty). Tweens between two views. Pure. */
import { power3InOut } from "@/lib/tmsc/ease";

export type View = { s: number; tx: number; ty: number };
export const IDENTITY: View = { s: 1, tx: 0, ty: 0 };

export function mixView(a: View, b: View, t: number): View {
  const e = power3InOut(t);
  // interpolate scale in log space so zooming feels even
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * e);
  return { s, tx: a.tx + (b.tx - a.tx) * e, ty: a.ty + (b.ty - a.ty) * e };
}

/** View that puts a world point at a screen point with scale s. */
export function viewOn(wx: number, wy: number, sx: number, sy: number, s: number): View {
  return { s, tx: sx - wx * s, ty: sy - wy * s };
}

export function toWorld(v: View, x: number, y: number): { x: number; y: number } {
  return { x: (x - v.tx) / v.s, y: (y - v.ty) / v.s };
}
