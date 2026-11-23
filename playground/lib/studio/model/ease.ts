import type { Bezier, Ease, EaseName } from "./types";

/** "ease" is After Effects' Easy Ease. */
export const EASES: Record<Exclude<EaseName, "hold">, Bezier> = {
  linear: [0, 0, 1, 1],
  ease: [0.33, 0, 0.67, 1],
  in: [0.33, 0, 1, 1],
  out: [0, 0, 0.67, 1],
};

export const EASE_LABELS: Record<EaseName, string> = { linear: "Linear", ease: "Easy ease", in: "Ease in", out: "Ease out", hold: "Hold" };

export const EXPO: Bezier = [0.16, 1, 0.3, 1];
export const BACK: Bezier = [0.34, 1.56, 0.64, 1];

/** Starting points in the curve editor; any of them can be reshaped by hand. */
export const EASE_PRESETS: { label: string; ease: Ease }[] = [
  { label: "Linear", ease: "linear" },
  { label: "Easy ease", ease: "ease" },
  { label: "Ease in", ease: "in" },
  { label: "Ease out", ease: "out" },
  { label: "Expo", ease: EXPO },
  { label: "Back", ease: BACK },
  { label: "Hold", ease: "hold" },
];

/** Same curve? Named eases compare by their bezier, so "ease" equals [0.33, 0, 0.67, 1]. */
export function sameEase(a: Ease, b: Ease): boolean {
  if (a === "hold" || b === "hold") return a === b;
  const x = typeof a === "string" ? EASES[a] : a;
  const y = typeof b === "string" ? EASES[b] : b;
  return x.every((v, i) => Math.abs(v - y[i]) < 1e-3);
}

/** cubic-bezier at u ∈ [0, 1]: Newton with a bisection fallback. */
export function bezier([x1, y1, x2, y2]: Bezier, u: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  let t = u;
  for (let i = 0; i < 8; i++) {
    const err = sx(t) - u;
    if (Math.abs(err) < 1e-7) return ((ay * t + by) * t + cy) * t;
    const d = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }
  let lo = 0;
  let hi = 1;
  t = u;
  for (let i = 0; i < 40; i++) {
    if (sx(t) < u) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return ((ay * t + by) * t + cy) * t;
}

export const ease = (e: Ease, u: number) => (e === "hold" ? 0 : bezier(typeof e === "string" ? EASES[e] : e, u));

/** The bezier behind any ease (hold has none). */
export const curveOf = (e: Ease): Bezier | null => (e === "hold" ? null : typeof e === "string" ? EASES[e] : e);
