/**
 * Page-turn easings as CSS-style cubic-bézier curves (x1, y1, x2, y2), so the same names and
 * numbers mean the same thing as in After Effects or CSS. Pure.
 */

export const EASES = {
  Hand: [0.45, 0, 0.55, 1], // slow lift, quick middle, soft landing (the default)
  "Ease in-out": [0.65, 0, 0.35, 1],
  "Ease out": [0.22, 1, 0.36, 1],
  "Ease in": [0.55, 0, 1, 0.45],
  Snappy: [0.8, 0, 0.1, 1],
  Soft: [0.3, 0.1, 0.3, 1],
  Linear: [0, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type EaseName = keyof typeof EASES;
export const EASE_NAMES = Object.keys(EASES) as EaseName[];

/** y(x) for a cubic bézier from (0,0) to (1,1). Newton steps with a bisection fallback. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-6) return sy(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

const cache = new Map<string, (x: number) => number>();
export function easeFn(name: string): (x: number) => number {
  const key = name in EASES ? (name as EaseName) : "Hand";
  let f = cache.get(key);
  if (!f) {
    const [x1, y1, x2, y2] = EASES[key];
    f = cubicBezier(x1, y1, x2, y2);
    cache.set(key, f);
  }
  return f;
}

/** An SVG path of the curve in a w×h box (y up), for the timeline's turn blocks. */
export function easePath(name: string, w: number, h: number, steps = 24): string {
  const f = easeFn(name);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const x = i / steps;
    return `${i ? "L" : "M"}${(x * w).toFixed(1)} ${(h - f(x) * h).toFixed(1)}`;
  }).join(" ");
}
