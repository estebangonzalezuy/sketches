import { uid } from "./random";
import type { Arc, Bands, Flower, Headline, Lockup, Mark, Spiral, Swatch } from "./types";

export const flower = (cx: number, cy: number, r: number, fills: Swatch[], o: Partial<Flower> = {}): Flower => ({
  id: uid("f"), kind: "flower", cx, cy, r, rot: 0, petals: 8, style: "petal", fills, disc: "cream", dots: "cream", ticks: true, ...o,
});

export const spiral = (cx: number, cy: number, r: number, fills: Swatch[], o: Partial<Spiral> = {}): Spiral => ({
  id: uid("s"), kind: "spiral", cx, cy, r, rot: 0, rings: 4, perRing: 8, fills, ...o,
});

export const arc = (cx: number, cy: number, r: number, band: number, fills: Swatch[], start: number, end: number): Arc => ({
  id: uid("a"), kind: "arc", cx, cy, r, band, fills, start, end,
});

export const bands = (x: number, y: number, w: number, h: number, band: number, fills: Swatch[]): Bands => ({
  id: uid("n"), kind: "bands", x, y, w, h, band, fills,
});

export const headline = (x: number, y: number, size: number, text: string, o: Partial<Headline> = {}): Headline => ({
  id: uid("h"), kind: "headline", x, y, size, text, vertical: false, box: true, ...o,
});

export const lockup = (x: number, y: number, size: number): Lockup => ({
  id: uid("l"), kind: "lockup", x, y, size, text: "the Motion\nSocial Club", box: true,
});

export const mark = (cx: number, cy: number, size: number, fill: Swatch = "ink"): Mark => ({
  id: uid("m"), kind: "mark", cx, cy, size, fill, box: true,
});

/** Ink box of a headline before layout, for fitting. Injected so generation stays pure and testable. */
export type Measure = (text: string, size: number) => { w: number; h: number };

/** Rough metrics for a heavy condensed grotesk, used when no font is loaded (tests). */
export const approxMeasure: Measure = (text, size) => {
  const lines = text.split("\n");
  return { w: Math.max(...lines.map((l) => l.length)) * size * 0.44, h: size * (0.72 + (lines.length - 1) * 0.9) };
};

/** Largest size whose ink fits w × h (horizontal) or h × w (vertical). */
export function fitSize(m: Measure, text: string, w: number, h: number, vertical = false): number {
  const a = m(text, 100);
  const [bw, bh] = vertical ? [a.h, a.w] : [a.w, a.h];
  return Math.floor(100 * Math.min(w / bw, h / bh));
}
