import type { Composition, Layer } from "@/lib/kv/model";
import { animatable, layerKeys } from "./animate";
import type { Behavior, BehaviorKind, Dir } from "./types";

type Step = [BehaviorKind, Dir, number, number, number]; // kind, dir, amount, start, length

/** The KV's choreography by layer type: structure first, then type, then the marks. */
const BY_TYPE: Partial<Record<Layer["type"], Step[]>> = {
  block: [["wipe", "up", 1, 0, 0.3]],
  bracket: [["wipe", "down", 1, 0.08, 0.3]],
  grid: [["wipe", "right", 1, 0.14, 0.4]],
  // hard wipe, not a fade: coarse cells stay solid ink instead of going muddy
  headline: [
    ["pixel", "up", 1, 0.3, 0.36],
    ["wipe", "right", 1, 0.3, 0.14],
  ],
  text: [
    ["slide", "up", 0.08, 0.5, 0.3],
    ["fade", "up", 1, 0.5, 0.2],
  ],
  shape: [
    ["grow", "up", 1, 0.56, 0.3],
    ["spin", "right", 0.5, 0.56, 0.38],
  ],
  lockup: [
    ["wipe", "right", 1, 0.66, 0.26],
  ],
  image: [
    ["pixel", "up", 1, 0.4, 0.4],
    ["wipe", "right", 1, 0.4, 0.14],
  ],
};

/** Step between two layers of the same type, so blocks and words don't land together. */
const STAGGER = 0.07;

/** A complete starting mix for any KV poster. Deterministic: same poster, same mix. */
export function autoMix(c: Composition, id: () => string): Behavior[] {
  const keys = layerKeys(c);
  const seen = new Map<string, number>();
  const out: Behavior[] = [];
  for (const l of animatable(c)) {
    const steps = BY_TYPE[l.type];
    if (!steps) continue;
    const n = seen.get(l.type) ?? 0;
    seen.set(l.type, n + 1);
    const shift = n * STAGGER;
    for (const [kind, dir, amount, start, len] of steps) {
      const s = Math.min(0.9, start + shift);
      out.push({ id: id(), layer: keys.get(l.id)!, kind, dir: n % 2 && kind === "wipe" && l.type !== "headline" ? flip(dir) : dir, amount, start: s, end: Math.min(1, s + len) });
    }
  }
  return out;
}

const flip = (d: Dir): Dir => (d === "up" ? "down" : d === "down" ? "up" : d === "left" ? "right" : "left");
