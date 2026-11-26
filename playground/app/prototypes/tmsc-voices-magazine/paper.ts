/**
 * The magazine's paper as a 3D material: how it reflects light, how much relief the texture
 * gives it, how stiff and thick each sheet is, and how far it is from lying perfectly flat.
 * Pure: the scene turns these numbers into material settings and shader uniforms.
 */

export const PAPER_FINISHES = ["Matte", "Uncoated", "Satin", "Gloss"] as const;
export const PAPER_WEIGHTS = ["Light", "Regular", "Heavy"] as const;
export type PaperFinish = (typeof PAPER_FINISHES)[number];
export type PaperWeight = (typeof PAPER_WEIGHTS)[number];

export type PaperSetup = { finish: PaperFinish; relief: number; weight: PaperWeight; waviness: number };
export const DEFAULT_PAPER: PaperSetup = { finish: "Matte", relief: 0.4, weight: "Regular", waviness: 1 };

/** Matte has no specular at all (Lambert); the others are PBR with falling roughness. */
export function finishMaterial(f: PaperFinish): { model: "lambert" } | { model: "standard"; roughness: number } {
  if (f === "Matte") return { model: "lambert" };
  return { model: "standard", roughness: { Uncoated: 0.85, Satin: 0.5, Gloss: 0.22 }[f] };
}

/** Light paper curls more and stacks thinner; heavy stock stays flatter and stacks thicker. */
export function weightParams(w: PaperWeight): { bend: number; gap: number } {
  return { Light: { bend: 1.3, gap: 0.0024 }, Regular: { bend: 1, gap: 0.0032 }, Heavy: { bend: 0.65, gap: 0.0048 } }[w];
}

export function paperFrom(v: Record<string, unknown>): PaperSetup {
  const pct = (x: unknown, d: number) => (Number.isFinite(Number(x)) ? Math.min(2, Math.max(0, Number(x) / 100)) : d);
  return {
    finish: PAPER_FINISHES.includes(v.paperFinish as PaperFinish) ? (v.paperFinish as PaperFinish) : DEFAULT_PAPER.finish,
    relief: pct(v.paperRelief, DEFAULT_PAPER.relief),
    weight: PAPER_WEIGHTS.includes(v.paperWeight as PaperWeight) ? (v.paperWeight as PaperWeight) : DEFAULT_PAPER.weight,
    waviness: pct(v.paperWaviness, DEFAULT_PAPER.waviness),
  };
}
