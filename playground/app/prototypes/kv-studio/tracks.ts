import { ease } from "./easing";
import type { Key, Prop, Track } from "./types";

/** Value of each channel when nothing animates it. */
export const REST: Record<Prop, number> = { dx: 0, dy: 0, scale: 1, rotate: 0, alpha: 1, pixel: 0, reveal: 1 };

/** A track's value at `t` seconds. Before the first key and after the last, the value holds. */
export function evaluateTrack(keys: Key[], t: number, rest: number): number {
  if (!keys.length) return rest;
  if (t <= keys[0].t) return keys[0].v;
  const last = keys[keys.length - 1];
  if (t >= last.t) return last.v;
  let i = 0;
  while (keys[i + 1].t <= t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  if (a.ease === "hold") return a.v;
  return a.v + (b.v - a.v) * ease(a.ease, (t - a.t) / (b.t - a.t));
}

const sortKeys = (keys: Key[]) => [...keys].sort((a, b) => a.t - b.t);

/** Adds or replaces (same time, within half a frame) a key, returning new tracks. */
export function upsertKey(tracks: Track[], layer: string, prop: Prop, key: Key, halfFrame: number): Track[] {
  const i = tracks.findIndex((tr) => tr.layer === layer && tr.prop === prop);
  if (i < 0) return [...tracks, { layer, prop, keys: [key] }];
  const keys = tracks[i].keys.filter((k) => Math.abs(k.t - key.t) > halfFrame);
  const next = [...tracks];
  next[i] = { ...tracks[i], keys: sortKeys([...keys, key]) };
  return next;
}

export function updateKey(tracks: Track[], id: string, patch: Partial<Omit<Key, "id">>): Track[] {
  return tracks.map((tr) =>
    tr.keys.some((k) => k.id === id) ? { ...tr, keys: sortKeys(tr.keys.map((k) => (k.id === id ? { ...k, ...patch } : k))) } : tr,
  );
}

export function removeKey(tracks: Track[], id: string): Track[] {
  return tracks.map((tr) => ({ ...tr, keys: tr.keys.filter((k) => k.id !== id) })).filter((tr) => tr.keys.length > 0);
}
