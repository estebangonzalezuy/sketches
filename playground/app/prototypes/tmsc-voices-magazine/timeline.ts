import { BEND_CASCADE, BEND_TURN, HOVER_LIFT } from "./data";
import { easeFn } from "./easing";
import type { Book } from "./faces";
import { clamp, ease, smoothstep } from "./pose";
import type { Timing } from "./timing";
import type { SheetPose } from "./types";

/**
 * The Record sequence, as a pure function of time. Same t → same frame, always: no clocks,
 * no randomness. The magazine lands, holds on the cover, turns through every spread (holding
 * on each), then flips back to the cover. Timing and easing come from `Timing`.
 */

type Turn = { sheet: number; dir: 1 | -1; start: number; dur: number; bend: number; lift: boolean; ease: string };

/** One block on the timeline. `key` is the sheet the segment belongs to (-1 = cover hold). */
export type Segment = { kind: "hold" | "turn" | "flip"; key: number; start: number; dur: number; label: string; ease?: string; edited: boolean };

export type RecordPlan = { turns: Turn[]; segments: Segment[]; duration: number; sheets: number };

/** Lift-in before a hand turn: the corner rises first, then the page goes (inside the hold). */
const LIFT_IN = 0.32;
/** The magazine settles onto the table during the first second. */
const ARRIVE = 1.2;
const COVER_HOLD = 0.8;
const BACK_HOLD = 0.6;
const END_HOLD = 0.9;

function holdFor(layout: string, t: Timing): number {
  if (layout === "editorial-left") return t.holdText;
  if (layout === "back-cover") return BACK_HOLD;
  return t.holdIntro;
}

export function recordPlan(book: Book, timing: Timing): RecordPlan {
  const n = book.sheets;
  const o = timing.overrides;
  const turns: Turn[] = [];
  const segments: Segment[] = [];
  const coverHold = o[-1]?.hold ?? COVER_HOLD;
  segments.push({ kind: "hold", key: -1, start: ARRIVE, dur: coverHold, label: book.spreadNames[0], edited: o[-1]?.hold !== undefined });
  let t = ARRIVE + coverHold;
  for (let k = 0; k < n; k++) {
    const dur = o[k]?.turn ?? timing.turn;
    const easing = o[k]?.ease ?? timing.ease;
    turns.push({ sheet: k, dir: 1, start: t, dur, bend: BEND_TURN, lift: true, ease: easing });
    segments.push({ kind: "turn", key: k, start: t, dur, label: `Turn ${k + 1}`, ease: easing, edited: o[k]?.turn !== undefined || o[k]?.ease !== undefined });
    t += dur;
    const hold = o[k]?.hold ?? holdFor(book.faces[2 * k + 1].layout, timing);
    segments.push({ kind: "hold", key: k, start: t, dur: hold, label: book.spreadNames[k + 1], edited: o[k]?.hold !== undefined });
    t += hold;
  }
  const flipStart = t;
  for (let i = 0; i < n; i++) {
    turns.push({ sheet: n - 1 - i, dir: -1, start: t + i * timing.stagger, dur: timing.cascade, bend: BEND_CASCADE, lift: false, ease: timing.ease });
  }
  const flipEnd = t + (n - 1) * timing.stagger + timing.cascade;
  segments.push({ kind: "flip", key: n, start: flipStart, dur: flipEnd - flipStart, label: "Flip-through", ease: timing.ease, edited: false });
  segments.push({ kind: "hold", key: n, start: flipEnd, dur: END_HOLD, label: book.spreadNames[0], edited: false });
  return { turns, segments, duration: flipEnd + END_HOLD, sheets: n };
}

function turnProgress(turn: Turn, t: number): number | null {
  const lead = turn.lift ? Math.min(LIFT_IN, turn.start) : 0;
  if (t < turn.start - lead) return null;
  // corner lift during the lead-in, then the turn from that lifted pose
  if (t < turn.start) return HOVER_LIFT * ease.out((t - (turn.start - lead)) / lead);
  const u = clamp((t - turn.start) / turn.dur);
  const from = turn.lift ? HOVER_LIFT : 0;
  return from + (1 - from) * easeFn(turn.ease)(u);
}

export type RecordFrame = { sheets: SheetPose[]; drop: number; shadow: number };

export function recordFrame(plan: RecordPlan, t: number): RecordFrame {
  const sheets: SheetPose[] = Array.from({ length: plan.sheets }, () => ({ p: 0, sign: 1, bend: BEND_TURN, phi: 0 }));
  for (const turn of plan.turns) {
    const q = turnProgress(turn, t);
    if (q === null) continue;
    const s = sheets[turn.sheet];
    s.sign = turn.dir;
    s.bend = turn.bend;
    s.p = turn.dir === 1 ? q : 1 - q;
    // hand turns start from the bottom corner and straighten out by mid-turn
    s.phi = turn.lift ? -0.24 * (1 - smoothstep(0.05, 0.6, q)) : 0;
  }
  const arrive = ease.out(clamp((t - 0.2) / 1.0));
  return { sheets, drop: 1 - arrive, shadow: arrive };
}

/** The spread on show at time t (sheets past halfway count as turned). */
export function spreadAt(plan: RecordPlan, t: number): number {
  return recordFrame(plan, t).sheets.filter((s) => s.p > 0.5).length;
}
