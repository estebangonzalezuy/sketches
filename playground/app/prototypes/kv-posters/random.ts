/** Seeded randomness: the same seed always builds the same poster. */
export type Rng = {
  (): number;
  range(a: number, b: number): number;
  int(a: number, b: number): number;
  pick<T>(xs: readonly T[]): T;
  chance(p: number): boolean;
};

export function rng(seed: number): Rng {
  let a = (seed * 2654435761) >>> 0 || 1;
  const next = (() => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Rng;
  next.range = (lo, hi) => lo + (hi - lo) * next();
  next.int = (lo, hi) => Math.floor(next.range(lo, hi + 1));
  next.pick = (xs) => xs[Math.floor(next() * xs.length)];
  next.chance = (p) => next() < p;
  return next;
}

let n = 0;
export const uid = (p = "e") => `${p}${Date.now().toString(36).slice(-4)}${(n++).toString(36)}`;
