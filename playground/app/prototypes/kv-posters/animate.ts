import type { AnimStyle, Element, ElState, Kind, Poster } from "./types";

export interface AnimSettings {
  style: AnimStyle;
  duration: number;
  /** 0 = everything of a kind together, 1 = one after another */
  stagger: number;
  /** whole turns per loop of the spinning motifs (keeps the loop seamless) */
  turns: number;
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

/** Pure: the state of every element at time t. Same call for the preview and every exported frame. */
export function animate(p: Poster, t: number, s: AnimSettings): AnimFrame {
  const u = s.duration > 0 ? clamp01(t / s.duration) : 1;
  const b = buildAt(s.style, u);
  const spinning = s.style === "loop" || s.style === "build + loop";
  const ranks = new Map<Kind, Element[]>();
  for (const e of p.elements) ranks.set(e.kind, [...(ranks.get(e.kind) ?? []), e]);
  for (const list of ranks.values()) list.sort((a, c) => top(a) - top(c));
  const els = new Map<string, ElState>();
  for (const e of p.elements) {
    const list = ranks.get(e.kind)!;
    const r = list.length > 1 ? list.indexOf(e) / (list.length - 1) : 0;
    const start = Math.min(1 - LEN, BASE[e.kind] + r * 0.28 * s.stagger);
    els.set(e.id, { p: clamp01((b - start) / LEN), spin: spinning ? period(e) * s.turns * u : 0 });
  }
  return { frame: clamp01(b / 0.3), els };
}

const top = (e: Element) => ("y" in e ? e.y : e.cy);
