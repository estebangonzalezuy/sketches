import type { Ease, Sample, Track, TrackId } from "./types";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Where v sits between a and b, clamped to 0–1. */
export function remap(v: number, a: number, b: number): number {
  if (a === b) return v >= b ? 1 : 0;
  return clamp01((v - a) / (b - a));
}

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Cubic curves (they match the readouts in the reference talk). */
export const EASES: Record<Ease, (p: number) => number> = {
  linear: (p) => p,
  easeIn: (p) => p * p * p,
  easeOut: (p) => 1 - (1 - p) ** 3,
  easeInOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2),
};

export function inputOf(track: Track, t: number): number {
  const i = track.input;
  if (i.kind === "window") return remap(t, i.from, i.to);
  return Math.min(remap(t, 0, i.inEnd), 1 - remap(t, i.outStart, 1));
}

/** t → input remap → ease → output range. */
export function sampleTrack(track: Track, t: number): Sample {
  const progress = EASES[track.ease](inputOf(track, clamp01(t)));
  return { progress, value: lerp(track.out[0], track.out[1], progress) };
}

export function sampleAll(tracks: Track[], t: number): Record<TrackId, number> {
  const out = { x: 50, y: 50, scale: 1, opacity: 1 };
  for (const tr of tracks) out[tr.id] = sampleTrack(tr, t).value;
  return out;
}

/** Points along the x/y path, for drawing the trajectory. */
export function pathPoints(tracks: Track[], steps = 64): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const v = sampleAll(tracks, i / steps);
    pts.push([v.x, v.y]);
  }
  return pts;
}
