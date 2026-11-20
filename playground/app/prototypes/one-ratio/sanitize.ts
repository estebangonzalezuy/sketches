import { EASES } from "./ratio";
import type { Ease, Track, TrackInput } from "./types";

const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const unit = (v: unknown, fallback: number) => Math.min(1, Math.max(0, num(v, fallback)));

function sanitizeInput(raw: unknown, def: TrackInput): TrackInput {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (def.kind === "window") return { kind: "window", from: unit(r.from, def.from), to: unit(r.to, def.to) };
  return { kind: "envelope", inEnd: unit(r.inEnd, def.inEnd), outStart: unit(r.outStart, def.outStart) };
}

/** Stored tracks merged over the defaults: same ids and order, invalid fields dropped. */
export function sanitizeTracks(raw: unknown, defaults: Track[]): Track[] {
  const list = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
  return defaults.map((def) => {
    const r = list.find((x) => x && typeof x === "object" && x.id === def.id);
    if (!r) return def;
    const ease = typeof r.ease === "string" && r.ease in EASES ? (r.ease as Ease) : def.ease;
    const out = Array.isArray(r.out) ? r.out : [];
    return {
      id: def.id,
      input: sanitizeInput(r.input, def.input),
      ease,
      out: [num(out[0], def.out[0]), num(out[1], def.out[1])],
    };
  });
}
