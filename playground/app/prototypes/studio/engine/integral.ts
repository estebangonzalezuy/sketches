import { valueAt } from "../model/tracks";
import type { Track } from "../model/types";

/**
 * ∫ of a numeric track from `from` to `t` seconds, by trapezoids on frames. Prefix sums are
 * cached per track object (edits create new tracks), so a frame never depends on which frames
 * were rendered before it, which keeps preview and export identical.
 */
const cache = new WeakMap<Track, { key: string; sums: Float64Array }>();

export function integralOf(track: Track, from: number, t: number, fps: number): number {
  if ("value" in track) return typeof track.value === "number" ? track.value * Math.max(0, t - from) : 0;
  const frames = Math.max(0, Math.round((t - from) * fps));
  const key = `${from}/${fps}`;
  let c = cache.get(track);
  if (!c || c.key !== key || c.sums.length <= frames) {
    const n = Math.max(frames + 1, c && c.key === key ? c.sums.length * 2 : 64);
    const sums = new Float64Array(n);
    let prev = Number(valueAt(track, from));
    for (let f = 1; f < n; f++) {
      const next = Number(valueAt(track, from + f / fps));
      sums[f] = sums[f - 1] + (prev + next) / 2 / fps;
      prev = next;
    }
    cache.set(track, (c = { key, sums }));
  }
  return c.sums[frames];
}
