import { bboxOf, type ShapePath } from "./geometry";

export type LettersOptions = {
  mode: "wave" | "alternate" | "random";
  /** vertical stretch: 0 = none, 1 = a letter can double (or shrink to nothing) */
  stretch: number;
  /** horizontal shear in degrees at full swing */
  skew: number;
  /** waves across the word (wave mode) */
  frequency: number;
  /** animate this to make the letters move: one full turn = 360 */
  phase: number;
  /** where each letter is pinned while it stretches */
  pin: "baseline" | "center" | "top";
  seed: number;
};

const hash = (i: number, seed: number) => {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Each letter's swing, -1…1. */
export function swing(i: number, n: number, o: LettersOptions): number {
  const ph = (o.phase * Math.PI) / 180;
  if (o.mode === "alternate") return (i % 2 ? 1 : -1) * Math.cos(ph);
  if (o.mode === "random") return Math.sin(hash(i, o.seed) * Math.PI * 2 + ph);
  return Math.sin((i / Math.max(1, n)) * o.frequency * Math.PI * 2 + ph);
}

/**
 * Per-letter kinetic type ("Hard Work"): every path is one letter. Each is stretched
 * vertically and sheared by its own swing, pinned at its baseline (or centre/top), so
 * the word keeps its line while the letters grow, shrink and lean.
 */
export function letters(paths: ShapePath[], o: LettersOptions): ShapePath[] {
  const n = paths.length;
  return paths.map((p, i) => {
    const s = swing(i, n, o);
    const sy = Math.max(0.02, 1 + o.stretch * s);
    const k = Math.tan(((o.skew * s) * Math.PI) / 180);
    const b = bboxOf([p]);
    const py = o.pin === "top" ? b.y : o.pin === "center" ? b.y + b.h / 2 : b.y + b.h;
    return {
      ...p,
      contours: p.contours.map((c) =>
        c.map(([x, y]) => {
          const ny = py + (y - py) * sy;
          return [x + (ny - py) * -k, ny] as [number, number];
        }),
      ),
    };
  });
}
