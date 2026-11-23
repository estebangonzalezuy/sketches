/** Small statistics helpers for the report tools. Pure. */
export function sorted(values: readonly number[]): number[] {
  return values.slice().sort((a, b) => a - b);
}

/** Linear-interpolated quantile, q in 0..1, of an ascending array. */
export function quantile(asc: readonly number[], q: number): number {
  if (!asc.length) return NaN;
  const pos = (asc.length - 1) * Math.min(1, Math.max(0, q));
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return asc[lo] + (asc[hi] - asc[lo]) * (pos - lo);
}

export const median = (asc: readonly number[]) => quantile(asc, 0.5);

/** Share (0..100) of values strictly below `v`, counting ties as half. */
export function percentileRank(values: readonly number[], v: number): number {
  if (!values.length) return NaN;
  let below = 0, equal = 0;
  for (const x of values) {
    if (x < v) below++;
    else if (x === v) equal++;
  }
  return ((below + equal / 2) / values.length) * 100;
}

export function mean(values: readonly number[]): number {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : NaN;
}

/** Group items by a key, keeping `order` first (then any unexpected keys). */
export function groupBy<T, K extends string>(items: readonly T[], key: (t: T) => K, order: readonly K[] = []): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const k of order) m.set(k, []);
  for (const it of items) {
    const k = key(it);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(it);
  }
  for (const [k, v] of m) if (!v.length) m.delete(k);
  return m;
}

/** Index of the bin `v` falls into, for ascending edges [e0, e1, …, en]; last bin is open-ended. */
export function binIndex(edges: readonly number[], v: number): number {
  for (let i = edges.length - 1; i >= 0; i--) if (v >= edges[i]) return i;
  return 0;
}
