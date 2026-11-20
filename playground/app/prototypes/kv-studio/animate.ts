import type { LayerFx } from "@/lib/kv/render/render";
import type { Composition, Layer } from "@/lib/kv/model";
import { applyBehavior, wipeBox } from "./behaviors";
import { intersect, restChannels, toFx } from "./channels";
import { REST, evaluateTrack } from "./tracks";
import type { Anim, Box } from "./types";

/** Layers an animation can address: visible, and not video/GIF (those don't travel in the JSON). */
export const animatable = (c: Composition) => c.layers.filter((l) => l.visible && l.type !== "media");

/**
 * Stable address for each layer: its role when that role is unique in the poster (so
 * animations survive a format change or a re-import), otherwise its id.
 */
export function layerKeys(c: Composition): Map<string, string> {
  const count = new Map<string, number>();
  for (const l of c.layers) if (l.role) count.set(l.role, (count.get(l.role) ?? 0) + 1);
  return new Map(c.layers.map((l) => [l.id, l.role && count.get(l.role) === 1 ? l.role : l.id]));
}

/**
 * Everything that moves at time `t` (seconds) of a `duration`-second clip, as render fx
 * keyed by layer id. Keyframes are read at `t`; the behavior mix at Progress p = t / duration.
 * Pure: the composition is never mutated.
 */
export function animate(
  c: Composition,
  anim: Anim,
  t: number,
  duration: number,
  boundsOf: (l: Layer) => Box,
): Map<string, LayerFx> {
  const p = duration > 0 ? Math.max(0, Math.min(1, t / duration)) : 1;
  const keys = layerKeys(c);
  const stage = { width: c.width, height: c.height };
  const out = new Map<string, LayerFx>();
  for (const l of animatable(c)) {
    const key = keys.get(l.id)!;
    const tracks = anim.tracks.filter((tr) => tr.layer === key);
    const mix = anim.mix.filter((b) => b.layer === key);
    if (!tracks.length && !mix.length) continue;
    const box = boundsOf(l);
    const ch = restChannels();
    for (const tr of tracks) {
      const v = evaluateTrack(tr.keys, t, REST[tr.prop]);
      if (tr.prop === "dx" || tr.prop === "dy" || tr.prop === "rotate") ch[tr.prop] += v;
      else if (tr.prop === "scale" || tr.prop === "alpha") ch[tr.prop] *= v;
      else if (tr.prop === "pixel") ch.pixel = Math.max(ch.pixel, v);
      else if (v < 1 - 1e-4) ch.clip = intersect(ch.clip, wipeBox(box, "right", v, stage));
    }
    for (const b of mix) applyBehavior(ch, b, p, box, stage);
    const fx = toFx(ch);
    if (fx) out.set(l.id, fx);
  }
  return out;
}
