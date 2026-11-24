import type { Key } from "./types";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const MIN_GAP = 0.02;

/** Monotone cubic (Fritsch–Carlson): smooth through every key, never overshoots. */
export function evalCurve(keys: Key[], t: number): number {
  const n = keys.length;
  if (n === 0) return 0;
  if (n === 1 || t <= keys[0].t) return keys[0].v;
  if (t >= keys[n - 1].t) return keys[n - 1].v;

  const d = keys.slice(0, -1).map((k, i) => (keys[i + 1].v - k.v) / (keys[i + 1].t - k.t));
  const m = keys.map((_, i) =>
    i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2,
  );
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      m[i] = tau * a * d[i];
      m[i + 1] = tau * b * d[i];
    }
  }

  let i = 0;
  while (t > keys[i + 1].t) i++;
  const h = keys[i + 1].t - keys[i].t;
  const s = (t - keys[i].t) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  return (
    (2 * s3 - 3 * s2 + 1) * keys[i].v +
    (s3 - 2 * s2 + s) * h * m[i] +
    (-2 * s3 + 3 * s2) * keys[i + 1].v +
    (s3 - s2) * h * m[i + 1]
  );
}

/** Move one key. The first and last stay pinned to t = 0 and t = 1; inner keys keep order. */
export function moveKey(keys: Key[], index: number, t: number, v: number, min: number, max: number): Key[] {
  const last = keys.length - 1;
  const nt =
    index === 0 ? 0 : index === last ? 1 : clamp(t, keys[index - 1].t + MIN_GAP, keys[index + 1].t - MIN_GAP);
  return keys.map((k, i) => (i === index ? { t: nt, v: clamp(v, min, max) } : k));
}

/** Insert a key in order. Returns the new keys and the new key's index. */
export function addKey(keys: Key[], t: number, v: number): { keys: Key[]; index: number } {
  const ct = clamp(t, MIN_GAP, 1 - MIN_GAP);
  let index = keys.findIndex((k) => k.t > ct);
  if (index <= 0) index = keys.length - 1;
  const next = [...keys.slice(0, index), { t: ct, v }, ...keys.slice(index)];
  return { keys: next, index };
}

/** Remove an inner key. Endpoints can't be removed. */
export function removeKey(keys: Key[], index: number): Key[] {
  if (index <= 0 || index >= keys.length - 1) return keys;
  return keys.filter((_, i) => i !== index);
}

/** Stored keys → valid keys (sorted, endpoints at 0 and 1, values in range), or the fallback. */
export function sanitizeKeys(raw: unknown, fallback: Key[], min: number, max: number): Key[] {
  if (!Array.isArray(raw) || raw.length < 2) return fallback;
  const keys: Key[] = [];
  for (const k of raw) {
    const r = k as Partial<Key>;
    if (typeof r?.t !== "number" || typeof r?.v !== "number" || !Number.isFinite(r.t) || !Number.isFinite(r.v))
      return fallback;
    keys.push({ t: clamp(r.t, 0, 1), v: clamp(r.v, min, max) });
  }
  keys.sort((a, b) => a.t - b.t);
  keys[0].t = 0;
  keys[keys.length - 1].t = 1;
  return keys;
}
