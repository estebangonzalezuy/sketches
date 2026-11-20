import { getTrack, layerTracks, setTrack } from "./paths";
import { isAnimated, sortKeys, valueAt } from "./tracks";
import type { EaseName, Key, ParamPath, Project, Track, Value } from "./types";

let n = 0;
export const uid = (p = "k") => `${p}${Date.now().toString(36)}${(n++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

const snap = (t: number, fps: number) => Math.round(t * fps) / fps;

/** Upserts a key at time `t` (replacing one on the same frame). */
function withKey(keys: Key[], t: number, v: Value, fps: number, ease: EaseName = "ease"): Key[] {
  const half = 0.5 / fps;
  const same = keys.find((k) => Math.abs(k.t - t) < half);
  if (same) return keys.map((k) => (k === same ? { ...k, v } : k));
  return sortKeys([...keys, { id: uid(), t, v, ease }]);
}

/**
 * Sets a parameter the way After Effects does: with the stopwatch on, it keys the value at
 * the playhead; with it off, it changes the fixed value.
 */
export function setValue(project: Project, p: ParamPath, v: Value, t: number): Project {
  const tr = getTrack(project, p);
  if (!tr) return project;
  const next: Track = isAnimated(tr) ? { keys: withKey(tr.keys, snap(t, project.fps), v, project.fps) } : { value: v };
  return setTrack(project, p, next);
}

/** Stopwatch: on keys the current value at the playhead; off keeps the value at the playhead. */
export function toggleStopwatch(project: Project, p: ParamPath, t: number): Project {
  const tr = getTrack(project, p);
  if (!tr) return project;
  const v = valueAt(tr, t);
  return setTrack(project, p, isAnimated(tr) ? { value: v } : { keys: [{ id: uid(), t: snap(t, project.fps), v, ease: "ease" }] });
}

/** Applies `fn` to every key of every track in the project; tracks left with no keys become fixed. */
function mapKeys(project: Project, fn: (k: Key) => Key | null): Project {
  let out = project;
  for (const l of project.layers)
    for (const { path, track } of layerTracks(l)) {
      if (!isAnimated(track)) continue;
      const keys = track.keys.map(fn).filter((k): k is Key => !!k);
      const changed = keys.length !== track.keys.length || keys.some((k, i) => k !== track.keys[i]);
      if (!changed) continue;
      out = setTrack(out, path, keys.length ? { keys: sortKeys(keys) } : { value: track.keys[0].v });
    }
  return out;
}

/** Moves the selected keys by `dt` seconds, snapped to frames and kept inside the comp. */
export const moveKeys = (project: Project, ids: Set<string>, dt: number, from: Map<string, number>) =>
  mapKeys(project, (k) =>
    ids.has(k.id) ? { ...k, t: Math.max(0, Math.min(project.duration, snap((from.get(k.id) ?? k.t) + dt, project.fps))) } : k,
  );

export const deleteKeys = (project: Project, ids: Set<string>) => mapKeys(project, (k) => (ids.has(k.id) ? null : k));

export const setKeysEase = (project: Project, ids: Set<string>, ease: EaseName) => mapKeys(project, (k) => (ids.has(k.id) ? { ...k, ease } : k));

export const setKeyValue = (project: Project, id: string, v: Value) => mapKeys(project, (k) => (k.id === id ? { ...k, v } : k));

/** Every key in the project, for selection and lookups. */
export function allKeys(project: Project): Map<string, { key: Key; path: ParamPath }> {
  const m = new Map<string, { key: Key; path: ParamPath }>();
  for (const l of project.layers)
    for (const { path, track } of layerTracks(l)) if (isAnimated(track)) for (const key of track.keys) m.set(key.id, { key, path });
  return m;
}
