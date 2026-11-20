import { presetFor } from "@/lib/kv/presets";
import type { FormatId } from "@/lib/kv/model";
import { kvToLayers } from "./kv-import";
import { uid } from "./ops";
import { emptyProject, newEffect } from "./project";
import type { EaseName, Layer, Project, Track, Value } from "./types";

const keys = (...k: [number, Value, EaseName?][]): Track => ({ keys: k.map(([t, v, ease]) => ({ id: uid(), t, v, ease: ease ?? "ease" })) });

/**
 * The Motion, Now poster, animated with every studio tool: blocks slide and grow, "Motion,"
 * unbends from a radial warp while its pixel cells shrink, "Now" lands from a corner pin,
 * the asterisk spins. Built after the fonts load (the headlines need them).
 */
export function demoProject(format: FormatId = "16x9"): Project {
  const kv = presetFor(format);
  const base = emptyProject(kv.width, kv.height);
  const layers = kvToLayers(kv, base).map((l) => animate(l, kv.width));
  return { ...base, name: "Motion, Now", background: kv.palette.paper, layers };
}

function animate(l: Layer, W: number): Layer {
  const pos = (l.transform.position as { value: [number, number] }).value;
  if (l.name === "Bloque rosa")
    return { ...l, transform: { ...l.transform, position: keys([0, [pos[0] - W * 0.6, pos[1]]], [0.9, pos]) } };
  if (l.name === "Bloque lila") return { ...l, transform: { ...l.transform, scale: keys([0.2, 0], [1.1, 1]) } };
  if (l.tool === "polygon") return { ...l, transform: { ...l.transform, position: keys([0.3, [pos[0], pos[1] - 700]], [1.2, pos]) } };
  if (l.name === "Grilla") return { ...l, transform: { ...l.transform, opacity: keys([0.6, 0], [1.4, 1]) } };
  if (l.tool === "text" && l.name.startsWith("Motion")) {
    const warp = newEffect("radial-warp", { center: [0, 900], inner: 500, depth: 340, angle: -125, sweep: 70 });
    warp.params.amount = keys([1, 1], [2.6, 0]);
    const px = newEffect("pixel-shape");
    px.params.cell = keys([1, 48, "out"], [2.8, 0]);
    return { ...l, effects: [px, warp], transform: { ...l.transform, opacity: keys([0.9, 0, "linear"], [1.1, 1]) } };
  }
  if (l.tool === "text" && l.name === "Now") {
    const pin = newEffect("corner-pin");
    pin.params.tl = keys([1.6, [0.35, -0.9]], [3, [0, 0]]);
    pin.params.tr = keys([1.6, [1.6, 0.25]], [3, [1, 0]]);
    pin.params.br = keys([1.6, [1.3, 1.2]], [3, [1, 1]]);
    pin.params.bl = keys([1.6, [-0.2, 0.75]], [3, [0, 1]]);
    return { ...l, effects: [pin], transform: { ...l.transform, opacity: keys([1.5, 0, "linear"], [1.7, 1]) } };
  }
  if (l.name === "Asterisco")
    return { ...l, transform: { ...l.transform, rotation: keys([2.6, -270, "out"], [3.8, 0]), scale: keys([2.6, 0], [3.4, 1]) } };
  if (l.name === "Lockup") return { ...l, transform: { ...l.transform, position: keys([3.2, [pos[0], pos[1] + 300]], [4, pos]) } };
  return l;
}
