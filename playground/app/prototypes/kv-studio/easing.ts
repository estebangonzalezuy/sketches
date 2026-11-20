import type { EaseName } from "./types";

type Bezier = [number, number, number, number];

export const EASES: Record<Exclude<EaseName, "hold">, Bezier> = {
  out: [0.22, 1, 0.36, 1],
  "in-out": [0.65, 0, 0.35, 1],
  in: [0.64, 0, 0.78, 0],
  linear: [0, 0, 1, 1],
};

/** cubic-bezier(x1, y1, x2, y2) at u ∈ [0, 1]: Newton with a bisection fallback (from motion-builder). */
export function bezier([x1, y1, x2, y2]: Bezier, u: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  let t = u;
  for (let i = 0; i < 8; i++) {
    const err = sampleX(t) - u;
    if (Math.abs(err) < 1e-7) return sampleY(t);
    const slope = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(slope) < 1e-6) break;
    t -= err / slope;
  }
  let lo = 0;
  let hi = 1;
  t = u;
  for (let i = 0; i < 40; i++) {
    if (sampleX(t) < u) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return sampleY(t);
}

export function ease(name: EaseName, u: number): number {
  if (name === "hold") return u >= 1 ? 1 : 0;
  return bezier(EASES[name], u);
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
