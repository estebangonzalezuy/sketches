/** Easing curves and tween helpers. Pure: no DOM. Every curve maps 0..1 → 0..1 (back/spring overshoot). */
export type Ease = (t: number) => number;

const c = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t);

export const linear: Ease = (t) => c(t);
export const power2Out: Ease = (t) => 1 - (1 - c(t)) ** 3;
export const power2InOut: Ease = (t) => ((t = c(t)) < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
export const power3Out: Ease = (t) => 1 - (1 - c(t)) ** 4;
export const power3InOut: Ease = (t) => ((t = c(t)) < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);
export const expoOut: Ease = (t) => ((t = c(t)) === 1 ? 1 : 1 - 2 ** (-10 * t));
export const expoInOut: Ease = (t) => {
  t = c(t);
  if (t === 0 || t === 1) return t;
  return t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2;
};
export const backOut: Ease = (t) => {
  t = c(t);
  const s = 1.70158;
  return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
};
export const backInOut: Ease = (t) => {
  t = c(t);
  const s = 1.70158 * 1.525;
  return t < 0.5
    ? ((2 * t) ** 2 * ((s + 1) * 2 * t - s)) / 2
    : ((2 * t - 2) ** 2 * ((s + 1) * (t * 2 - 2) + s) + 2) / 2;
};

/** Damped spring settled at t = 1. `bounce` 0 = no overshoot, 0.3 = a soft single bounce. */
export function spring(bounce = 0.2): Ease {
  const zeta = 1 - Math.min(0.9, Math.max(0, bounce));
  const omega = 9;
  return (t) => {
    t = c(t);
    if (t === 1) return 1;
    if (zeta >= 1) return 1 - (1 + omega * t) * Math.exp(-omega * t);
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    const e = Math.exp(-zeta * omega * t);
    const v = 1 - e * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
    // fade out any residue so the curve lands exactly on 1
    return v + (1 - v) * t ** 6;
  };
}

/** Drop with a floor bounce (marker landing). */
export const bounceOut: Ease = (t) => {
  t = c(t);
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

export const EASES = {
  power2: power2InOut,
  expo: expoInOut,
  back: backInOut,
} as const;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = c;

/** Local 0..1 progress of a segment that starts at `start` and lasts `dur` on a shared clock. */
export function segment(t: number, start: number, dur: number): number {
  return dur <= 0 ? (t >= start ? 1 : 0) : c((t - start) / dur);
}

/** Frame-rate independent exponential approach (critically damped feel). */
export function approach(current: number, target: number, dt: number, speed = 12): number {
  return target + (current - target) * Math.exp(-speed * dt);
}
