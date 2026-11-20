import { ease } from "./ease";
import type { Key, Track, Value } from "./types";

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const isColor = (v: Value): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

/** Interpolates two values of the same kind. Text, booleans and options hold. */
export function mix(a: Value, b: Value, u: number): Value {
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * u;
  if (Array.isArray(a) && Array.isArray(b)) return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  if (isColor(a) && isColor(b)) {
    const [x, y] = [hex(a), hex(b)];
    return toHex(x.map((v, i) => v + (y[i] - v) * u));
  }
  return u >= 1 ? b : a;
}

/** A track's value at `t` seconds. Before the first key and after the last, the value holds. */
export function valueAt(track: Track, t: number): Value {
  if ("value" in track) return track.value;
  const keys = track.keys;
  if (!keys.length) return 0;
  if (t <= keys[0].t) return keys[0].v;
  const last = keys[keys.length - 1];
  if (t >= last.t) return last.v;
  let i = 0;
  while (keys[i + 1].t <= t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  if (a.ease === "hold") return a.v;
  return mix(a.v, b.v, ease(a.ease, (t - a.t) / (b.t - a.t)));
}

export const isAnimated = (track: Track): track is { keys: Key[] } => "keys" in track;
export const sortKeys = (keys: Key[]) => [...keys].sort((a, b) => a.t - b.t);
