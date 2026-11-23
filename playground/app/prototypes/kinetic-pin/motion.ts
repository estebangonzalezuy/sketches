import { bezier } from "@/lib/studio/model/ease";
import type { Bezier } from "@/lib/studio/model/types";
import type { Pt, Quad } from "./types";

/** The steepness dial as an ease-in-out: s = 0.8 gives cubic-bezier(0.8, 0, 0.2, 1). */
export const steepCurve = (s: number): Bezier => [s, 0, 1 - s, 1];

/**
 * One loop of the swing, 0 → 1 → 0: rest at t = 0, full pose at half the loop, rest again
 * at the end, so the loop is seamless. Each half is eased by `curve`; a steep ease-in-out
 * holds long at both extremes and snaps fast through the middle.
 */
export function swing(t: number, loop: number, curve: Bezier): number {
  const u = (((t % loop) + loop) % loop) / loop;
  return bezier(curve, u < 0.5 ? u * 2 : 2 - u * 2);
}

export type Stack = { x0: number; x1: number; ys: number[] };

/**
 * Words stacked with no gap, each as wide as the stack and as tall as its glyphs' aspect
 * says (h / w of its tight crop), scaled to fit the frame inside `margin` and centred.
 * `ys` holds N + 1 edges: the outer top, the N − 1 shared edges, the outer bottom.
 */
export function restStack(frame: { w: number; h: number }, aspects: number[], margin: number): Stack {
  const m = margin * Math.min(frame.w, frame.h);
  let w = Math.max(1, frame.w - 2 * m);
  const total = aspects.reduce((a, r) => a + r, 0) * w;
  const avail = Math.max(1, frame.h - 2 * m);
  if (total > avail) w *= avail / total;
  const h = aspects.reduce((a, r) => a + r, 0) * w;
  const x0 = (frame.w - w) / 2;
  const ys = [(frame.h - h) / 2];
  for (const r of aspects) ys.push(ys[ys.length - 1] + r * w);
  return { x0, x1: x0 + w, ys };
}

export type PinMotion = {
  /** how far L and R travel, as a fraction of the mean word height */
  amplitude: number;
  /** seconds */
  loop: number;
  curve: Bezier;
  /** each shared edge starts this fraction of a loop later than the one above */
  phase: number;
};

/**
 * The words' quads at time t. Shared edge k (between word k−1 and word k) has its own
 * control points L_k and R_k: L moves down while R moves up, by the same amount. The outer
 * top, outer bottom and the left/right sides of the stack never move.
 */
export function quadsAt(stack: Stack, t: number, m: PinMotion): Quad[] {
  const n = stack.ys.length - 1;
  const meanH = (stack.ys[n] - stack.ys[0]) / Math.max(1, n);
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let k = 0; k <= n; k++) {
    const y = stack.ys[k];
    const outer = k === 0 || k === n;
    const dy = outer ? 0 : m.amplitude * meanH * swing(t - (k - 1) * m.phase * m.loop, m.loop, m.curve);
    L.push([stack.x0, y + dy]);
    R.push([stack.x1, y - dy]);
  }
  return Array.from({ length: n }, (_, i) => [L[i], R[i], R[i + 1], L[i + 1]] as Quad);
}

/** The word list for N stacked words: the user's words, repeated in order if N is larger. */
export function wordsFor(text: string, n: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const list = words.length ? words : ["HARD", "WORK"];
  return Array.from({ length: n }, (_, i) => list[i % list.length].toUpperCase());
}
