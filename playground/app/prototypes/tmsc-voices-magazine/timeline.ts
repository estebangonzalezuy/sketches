import { BEND_CASCADE, BEND_TURN, HOVER_LIFT } from "./data";
import type { Book } from "./faces";
import { clamp, ease, smoothstep } from "./pose";
import type { SheetPose } from "./types";

/**
 * The Record sequence, as a pure function of time. Same t → same frame, always: no clocks,
 * no randomness. Cover hold, every spread in order, back cover, then a quick flip-through
 * back to the cover.
 */

type Turn = { sheet: number; dir: 1 | -1; start: number; dur: number; bend: number; lift: boolean };

/** Lift-in before a hand turn: the corner rises first, then the page goes. */
const LIFT_IN = 0.32;
const FIRST_TURN = 2.0;
const HOLD = { "interview-left": 1.7, "editorial-left": 1.5, "back-cover": 0.6 } as Record<string, number>;
const CASCADE_DUR = 1.05;
const END_HOLD = 0.9;

export type RecordPlan = { turns: Turn[]; duration: number; sheets: number };

/**
 * Forward through every spread (a hold long enough to read each one), then a quick
 * flip-through back to the cover. Depends only on the page order, so a re-export is identical.
 */
export function recordPlan(book: Book): RecordPlan {
  const n = book.sheets;
  const turns: Turn[] = [];
  let t = FIRST_TURN;
  for (let k = 0; k < n; k++) {
    const dur = k === 0 ? 1.2 : k === n - 1 ? 0.9 : 1.0;
    turns.push({ sheet: k, dir: 1, start: t, dur, bend: BEND_TURN, lift: true });
    const landed = book.faces[2 * k + 1]; // left page of the spread this turn opens
    t += dur + (HOLD[landed.layout] ?? 1.5);
  }
  const stagger = Math.min(0.38, 2.4 / Math.max(1, n - 1));
  for (let i = 0; i < n; i++) turns.push({ sheet: n - 1 - i, dir: -1, start: t + i * stagger, dur: CASCADE_DUR, bend: BEND_CASCADE, lift: false });
  return { turns, duration: t + (n - 1) * stagger + CASCADE_DUR + END_HOLD, sheets: n };
}

function turnProgress(turn: Turn, t: number): number | null {
  const lead = turn.lift ? LIFT_IN : 0;
  if (t < turn.start - lead) return null;
  // corner lift during the lead-in, then the turn from that lifted pose
  if (t < turn.start) return HOVER_LIFT * ease.out((t - (turn.start - lead)) / lead);
  const u = clamp((t - turn.start) / turn.dur);
  const from = turn.lift ? HOVER_LIFT : 0;
  return from + (1 - from) * ease.turn(u);
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
