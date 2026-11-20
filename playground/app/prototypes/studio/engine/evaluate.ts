import { valueAt } from "../model/tracks";
import type { Layer, Params, Track } from "../model/types";
import type { Pt } from "./geometry";

export type TransformValues = { position: Pt; anchor: Pt; scale: number; rotation: number; opacity: number };

const evalAll = (tracks: Record<string, Track>, t: number): Params =>
  Object.fromEntries(Object.entries(tracks).map(([k, tr]) => [k, valueAt(tr, t)]));

export function transformAt(l: Layer, t: number): TransformValues {
  const v = evalAll(l.transform, t);
  return { position: v.position as Pt, anchor: v.anchor as Pt, scale: Number(v.scale), rotation: Number(v.rotation), opacity: Number(v.opacity) };
}

export const paramsAt = (tracks: Record<string, Track>, t: number) => evalAll(tracks, t);

/** Layer space → comp space as a 2D affine [a, b, c, d, e, f] (canvas setTransform order). */
export function layerMatrix(tv: TransformValues): number[] {
  const r = (tv.rotation * Math.PI) / 180;
  const cos = Math.cos(r) * tv.scale;
  const sin = Math.sin(r) * tv.scale;
  const [ax, ay] = tv.anchor;
  return [cos, sin, -sin, cos, tv.position[0] - (cos * ax - sin * ay), tv.position[1] - (sin * ax + cos * ay)];
}

export const applyMatrix = (m: number[], [x, y]: Pt): Pt => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

export function invertMatrix(m: number[]): number[] {
  const det = m[0] * m[3] - m[1] * m[2] || 1e-9;
  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
}

export const isActive = (l: Layer, t: number) => l.visible && t >= l.inPoint && t < l.outPoint + 1e-6;
