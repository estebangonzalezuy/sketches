/** Seeded randomness so the example survey is the same on every load. Pure. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal via Box–Muller. */
export function gaussian(rng: () => number): number {
  const u = Math.max(1e-9, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

export function pick<T>(rng: () => number, weighted: readonly (readonly [T, number])[]): T {
  const total = weighted.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of weighted) if ((r -= w) <= 0) return v;
  return weighted[weighted.length - 1][0];
}

export function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Smooth 1D value noise in -1..1, cheap enough for 300 dots × 60 fps. */
export function wobble(seed: number, t: number): number {
  return (
    Math.sin(t * 0.71 + seed * 12.9898) * 0.5 +
    Math.sin(t * 1.33 + seed * 78.233) * 0.3 +
    Math.sin(t * 2.17 + seed * 37.719) * 0.2
  );
}
