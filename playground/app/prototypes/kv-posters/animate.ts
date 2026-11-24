import { ease as applyEase } from "@/lib/studio/model/ease";
import type { Ease } from "@/lib/studio/model/types";
import type { AnimStyle, Clip, Element, ElState, Kind, Poster } from "./types";

export interface AnimSettings {
  style: AnimStyle;
  duration: number;
  /** 0 = everything of a kind together, 1 = one after another */
  stagger: number;
  /** whole turns per loop of the spinning motifs (keeps the loop seamless) */
  turns: number;
  /** timing curve of each element's build (spin stays linear so loops close) */
  ease?: Ease;
}

/** Shape a 0 → 1 progress with the chosen curve; "hold" jumps at the end. */
export function shape(e: Ease | undefined, u: number): number {
  if (!e || u <= 0 || u >= 1) return Math.min(1, Math.max(0, u));
  return e === "hold" ? 0 : applyEase(e, u);
}

export interface AnimFrame {
  /** grid and frame draw-on */
  frame: number;
  els: Map<string, ElState>;
}

/** Where each kind starts in the build, as a fraction of it. */
const BASE: Record<Kind, number> = { block: 0, bands: 0.04, spiral: 0.18, flower: 0.2, headline: 0.32, lockup: 0.48, mark: 0.54 };
const LEN = 0.4;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Rotational symmetry: one "turn" spins by this much, so the loop closes on itself. */
function period(e: Element): number {
  if (e.kind === "flower") return (Math.PI * 2) / e.petals;
  if (e.kind === "spiral") return (Math.PI * 2) / e.perRing;
  if (e.kind === "mark") return Math.PI / 3;
  return 0;
}

/** Build position b ∈ [0,1] at normalized time u for a style (1 = poster at rest). */
export function buildAt(style: AnimStyle, u: number): number {
  if (style === "loop") return 1;
  if (style === "in + out") return u < 0.5 ? clamp01(u / 0.45) : clamp01((1 - u) / 0.3);
  return clamp01(u / 0.7);
}

/** Window of the automatic choreography for one element, in fractions of the length. */
function autoClips(p: Poster, s: AnimSettings): Map<string, Clip> {
  const ranks = new Map<Kind, Element[]>();
  for (const e of p.elements) ranks.set(e.kind, [...(ranks.get(e.kind) ?? []), e]);
  for (const list of ranks.values()) list.sort((a, c) => top(a) - top(c));
  // "in + out" builds in the first half and mirrors out, so its windows are packed tighter
  const span = s.style === "in + out" ? 0.45 : 0.7;
  const out = new Map<string, Clip>();
  for (const e of p.elements) {
    const list = ranks.get(e.kind)!;
    const r = list.length > 1 ? list.indexOf(e) / (list.length - 1) : 0;
    const start = Math.min(1 - LEN, BASE[e.kind] + r * 0.28 * s.stagger);
    out.set(e.id, { start: start * span, end: (start + LEN) * span, effect: "build" });
  }
  return out;
}

/** Every element's clip: its hand-set one, or the automatic one. */
export function clipsFor(p: Poster, s: AnimSettings): Map<string, Clip> {
  const auto = autoClips(p, s);
  return new Map(p.elements.map((e) => [e.id, e.anim ?? auto.get(e.id)!]));
}

/** Progress of a clip at normalized time u. */
export function clipAt(c: Clip, u: number, fallback?: Ease): number {
  const len = Math.max(1e-4, c.end - c.start);
  return shape(c.ease ?? fallback, clamp01((u - c.start) / len));
}

/** Pure: the state of every element at time t. Same call for the preview and every exported frame. */
export function animate(p: Poster, t: number, s: AnimSettings): AnimFrame {
  const u = s.duration > 0 ? clamp01(t / s.duration) : 1;
  const spinning = s.style === "loop" || s.style === "build + loop";
  const clips = clipsFor(p, s);
  const els = new Map<string, ElState>();
  for (const e of p.elements) {
    const c = clips.get(e.id)!;
    const pr = s.style === "loop" ? 1 : s.style === "in + out" ? Math.min(clipAt(c, u, s.ease), clipAt(c, 1 - u, s.ease)) : clipAt(c, u, s.ease);
    // construct: every element draws itself from outlines, anchors and handles
    els.set(e.id, { p: pr, spin: spinning ? period(e) * s.turns * u : 0, effect: s.style === "construct" ? "construct" : c.effect });
  }
  return { frame: clamp01(buildAt(s.style, u) / 0.3), els };
}

const top = (e: Element) => ("y" in e ? e.y : e.cy);
