import { EASE_NAMES, type EaseName } from "./easing";

/**
 * How long things take and how they move. Global values come from the panel; segments you
 * stretch on the timeline are stored as overrides, keyed by sheet (-1 = the cover hold before
 * the first turn). Pure.
 */

export type SegmentOverride = { turn?: number; hold?: number; ease?: EaseName };
export type Overrides = Record<string, SegmentOverride>;

export type Timing = {
  /** Seconds per page turn. */
  turn: number;
  ease: EaseName;
  /** Seconds the camera rests on an intro spread / a Q&A spread. */
  holdIntro: number;
  holdText: number;
  /** Flip-through back to the cover: delay between sheets, seconds per sheet. */
  stagger: number;
  cascade: number;
  overrides: Overrides;
};

export const DEFAULT_TIMING: Timing = { turn: 1, ease: "Hand", holdIntro: 1.7, holdText: 1.5, stagger: 0.3, cascade: 1.05, overrides: {} };

export const LIMITS = { turn: [0.3, 4], hold: [0.2, 8] } as const;

const num = (v: unknown, d: number, [lo, hi]: readonly [number, number]) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(hi, Math.max(lo, n)) : d;
};

export function timingFrom(v: Record<string, unknown>, overrides: Overrides): Timing {
  const d = DEFAULT_TIMING;
  return {
    turn: num(v.turnDuration, d.turn, LIMITS.turn),
    ease: EASE_NAMES.includes(v.turnEase as EaseName) ? (v.turnEase as EaseName) : d.ease,
    holdIntro: num(v.holdIntro, d.holdIntro, LIMITS.hold),
    holdText: num(v.holdText, d.holdText, LIMITS.hold),
    stagger: num(v.flipStagger, d.stagger, [0.05, 1]),
    cascade: num(v.flipDuration, d.cascade, [0.3, 3]),
    overrides,
  };
}

/** A new overrides map with one segment changed (rounded to 0.05 s, clamped). */
export function withOverride(o: Overrides, key: number, part: "turn" | "hold", seconds: number): Overrides {
  const [lo, hi] = LIMITS[part];
  const s = Math.round(Math.min(hi, Math.max(lo, seconds)) * 20) / 20;
  return { ...o, [key]: { ...o[key], [part]: s } };
}

export function withEase(o: Overrides, key: number, ease: EaseName): Overrides {
  return { ...o, [key]: { ...o[key], ease } };
}

export function withoutOverride(o: Overrides, key: number, part: "turn" | "hold" | "ease"): Overrides {
  const next = { ...o[key] };
  delete next[part];
  const out = { ...o };
  if (Object.keys(next).length) out[key] = next;
  else delete out[key];
  return out;
}
