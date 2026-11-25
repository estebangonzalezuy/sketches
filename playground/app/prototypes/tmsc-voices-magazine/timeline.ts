import { BEND_CASCADE, BEND_TURN, HOVER_LIFT, SHEET_COUNT } from "./data";
import { clamp, ease, smoothstep } from "./pose";
import type { SheetPose } from "./types";

/**
 * The Record sequence, as a pure function of time. Same t → same frame, always: no clocks,
 * no randomness. Follows the storyboard table (cover hold, four spreads, back cover, then a
 * quick flip-through back to the cover).
 */

export const RECORD_DURATION = 18;

type Turn = { sheet: number; dir: 1 | -1; start: number; dur: number; bend: number; lift: boolean };

/** Lift-in before a hand turn: the corner rises first, then the page goes. */
const LIFT_IN = 0.32;

const FORWARD: [number, number][] = [
  [2.0, 1.2], // cover → Victor
  [5.0, 1.0], // Victor → Thais
  [7.6, 1.0], // Thais → Doug
  [10.2, 1.0], // Doug → Justin
  [13.0, 0.9], // Justin → back cover
];
const CASCADE_START = 14.5;
const CASCADE_STAGGER = 0.38;
const CASCADE_DUR = 1.05;

export const RECORD_TURNS: Turn[] = [
  ...FORWARD.map(([start, dur], sheet) => ({ sheet, dir: 1 as const, start, dur, bend: BEND_TURN, lift: true })),
  ...Array.from({ length: SHEET_COUNT }, (_, i) => ({
    sheet: SHEET_COUNT - 1 - i,
    dir: -1 as const,
    start: CASCADE_START + i * CASCADE_STAGGER,
    dur: CASCADE_DUR,
    bend: BEND_CASCADE,
    lift: false,
  })),
];

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

export function recordFrame(t: number): RecordFrame {
  const sheets: SheetPose[] = Array.from({ length: SHEET_COUNT }, () => ({ p: 0, sign: 1, bend: BEND_TURN, phi: 0 }));
  for (const turn of RECORD_TURNS) {
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
