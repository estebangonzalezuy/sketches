import { curveOf } from "../model/ease";
import { valueAt } from "../model/tracks";
import type { Bezier, Key } from "../model/types";

/**
 * The graph editor's model. Number tracks draw as a value graph (real units); anything else
 * (positions, colours…) as a progress graph: each segment rises 0 → 1, so its ease is what
 * you see and edit either way. A segment's bezier handles live in its own box:
 *   P1 = (ta + x1·dt, va + y1·dv)   P2 = (ta + x2·dt, va + y2·dv)
 */
export type GraphSeg = { a: Key; b: Key; curve: Bezier | null; va: number; vb: number };

const numeric = (keys: Key[]) => keys.every((k) => typeof k.v === "number");

/** Plotted value of key i: its number, or 0/1 alternating per segment end in progress mode. */
export function segments(keys: Key[]): { segs: GraphSeg[]; numeric: boolean } {
  const num = numeric(keys);
  const segs: GraphSeg[] = [];
  for (let i = 0; i + 1 < keys.length; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    segs.push({ a, b, curve: curveOf(a.ease), va: num ? Number(a.v) : 0, vb: num ? Number(b.v) : 1 });
  }
  return { segs, numeric: num };
}

/** y range to fit the curve and its handles, padded. */
export function range(keys: Key[], segs: GraphSeg[], num: boolean): [number, number] {
  if (!num) return [-0.15, 1.15];
  let lo = Infinity;
  let hi = -Infinity;
  const see = (v: number) => {
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  };
  for (const k of keys) see(Number(k.v));
  for (const s of segs) {
    if (!s.curve) continue;
    see(s.va + s.curve[1] * (s.vb - s.va));
    see(s.va + s.curve[3] * (s.vb - s.va));
    for (let i = 1; i < 16; i++) see(Number(valueAt({ keys: [s.a, s.b] }, s.a.t + ((s.b.t - s.a.t) * i) / 16)));
  }
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.12;
  return [lo - pad, hi + pad];
}

/** Polyline samples of the plotted curve, in (seconds, plotted value). */
export function samples(segs: GraphSeg[], num: boolean, keys: Key[]): [number, number][] {
  if (num) {
    const pts: [number, number][] = [];
    const a = keys[0].t;
    const b = keys[keys.length - 1].t;
    const n = 240;
    for (let i = 0; i <= n; i++) {
      const t = a + ((b - a) * i) / n;
      pts.push([t, Number(valueAt({ keys }, t))]);
    }
    return pts;
  }
  const pts: [number, number][] = [];
  for (const s of segs) {
    for (let i = 0; i <= 32; i++) {
      const t = s.a.t + ((s.b.t - s.a.t) * i) / 32;
      const u = Number(valueAt({ keys: [{ ...s.a, v: 0 }, { ...s.b, v: 1 }] }, t));
      pts.push([t, u]);
    }
  }
  return pts;
}

/** Handle positions of a segment in (seconds, plotted value). */
export function handles(s: GraphSeg): [[number, number], [number, number]] | null {
  if (!s.curve) return null;
  const dt = s.b.t - s.a.t;
  const dv = s.vb - s.va;
  return [
    [s.a.t + s.curve[0] * dt, s.va + s.curve[1] * dv],
    [s.a.t + s.curve[2] * dt, s.va + s.curve[3] * dv],
  ];
}

/** New curve after dragging handle `which` to (t, v). x stays inside the segment; y may overshoot. */
export function dragHandle(s: GraphSeg, which: 0 | 1, t: number, v: number): Bezier {
  const c = [...(s.curve ?? [0.33, 0, 0.67, 1])] as Bezier;
  const dt = s.b.t - s.a.t || 1e-6;
  const dv = s.vb - s.va;
  const x = Math.max(0, Math.min(1, (t - s.a.t) / dt));
  const y = Math.abs(dv) < 1e-9 ? c[which * 2 + 1] : (v - s.va) / dv;
  c[which * 2] = x;
  c[which * 2 + 1] = Math.max(-2, Math.min(3, y));
  return c;
}
