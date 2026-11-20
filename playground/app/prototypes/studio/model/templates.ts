import { tools as MB_TOOLS } from "@/lib/motion-builder/tools";
import type { AnimationKey } from "@/lib/motion-builder/core/tool";
import { uid } from "./ops";
import { getTrack, mapLayer, setTrack } from "./paths";
import { newEffect } from "./project";
import { valueAt } from "./tracks";
import type { Ease, EffectInstance, Key, Layer, ParamPath, Project, Track, Value } from "./types";

/**
 * Animation templates: real keyframes written into a layer (at the playhead), which stay
 * editable on the timeline. They're how an environment says "this is how things move here".
 */
export type Template = { id: string; name: string; fits: (l: Layer) => boolean; apply: (p: Project, layerId: string, t0: number) => Project };

const ks = (...k: [number, Value, Ease?][]): Track => ({ keys: k.map(([t, v, ease]) => ({ id: uid(), t, v, ease: ease ?? "ease" })) });
const BACK: Ease = [0.34, 1.56, 0.64, 1];
const EXPO: Ease = [0.16, 1, 0.3, 1];
const isVector = (l: Layer) => ["text", "rect", "polygon"].includes(l.tool);
const T = (l: Layer, param: keyof Layer["transform"]): ParamPath => ({ layer: l.id, group: "transform", param });
const at = (p: Project, path: ParamPath, t: number) => valueAt(getTrack(p, path)!, t);
const layerOf = (p: Project, id: string) => p.layers.find((l) => l.id === id)!;
const withEffect = (p: Project, id: string, fx: EffectInstance) => mapLayer(p, id, (l) => ({ ...l, effects: [...l.effects.filter((e) => e.tool !== fx.tool), fx] }));

const transform = (id: string, name: string, make: (p: Project, l: Layer, t0: number) => Partial<Record<keyof Layer["transform"], Track>>): Template => ({
  id,
  name,
  fits: () => true,
  apply(p, layerId, t0) {
    const l = layerOf(p, layerId);
    let out = p;
    for (const [k, tr] of Object.entries(make(p, l, t0))) out = setTrack(out, T(l, k as keyof Layer["transform"]), tr!);
    return out;
  },
});

const effectTemplate = (id: string, name: string, tool: string, keys: (t0: number, l: Layer) => Record<string, Track>, over: Record<string, Value> = {}, fits = isVector): Template => ({
  id,
  name,
  fits,
  apply(p, layerId, t0) {
    const fx = newEffect(tool, over);
    Object.assign(fx.params, keys(t0, layerOf(p, layerId)));
    return withEffect(p, layerId, fx);
  },
});

export const STUDIO_TEMPLATES: Template[] = [
  transform("fade-in", "Fade in", (_p, _l, t) => ({ opacity: ks([t, 0, "out"], [t + 0.6, 1]) })),
  transform("slide-up", "Slide up", (p, l, t) => {
    const [x, y] = at(p, T(l, "position"), t) as [number, number];
    return { position: ks([t, [x, y + p.height * 0.2], EXPO], [t + 0.8, [x, y]]), opacity: ks([t, 0, "out"], [t + 0.3, 1]) };
  }),
  transform("pop", "Pop", (_p, _l, t) => ({ scale: ks([t, 0, BACK], [t + 0.6, 1]) })),
  transform("spin-in", "Spin in", (_p, _l, t) => ({ rotation: ks([t, -180, EXPO], [t + 0.9, 0]), scale: ks([t, 0, EXPO], [t + 0.9, 1]) })),
  effectTemplate("pixel-build", "Pixel build", "pixel-shape", (t) => ({ cell: ks([t, 60, "out"], [t + 1.4, 0]) })),
  effectTemplate("pin-land", "Corner pin land", "corner-pin", (t) => ({
    tl: ks([t, [0.35, -0.9]], [t + 1.2, [0, 0]]),
    tr: ks([t, [1.6, 0.25]], [t + 1.2, [1, 0]]),
    br: ks([t, [1.3, 1.2]], [t + 1.2, [1, 1]]),
    bl: ks([t, [-0.2, 0.75]], [t + 1.2, [0, 1]]),
  })),
  effectTemplate("radial-unbend", "Radial unbend", "radial-warp", (t) => ({ amount: ks([t, 1], [t + 1.4, 0]) }), { center: [0, 900], inner: 500, depth: 340, angle: -125, sweep: 70 }),
  effectTemplate("letters-wave", "Letters: wave loop", "letters", (_t, l) => ({ phase: ks([l.inPoint, 0, "linear"], [l.outPoint, 720]) }), {}, (l) => l.tool === "text"),
  effectTemplate("hard-work", "Letters: hard work", "letters", (t) => ({ phase: ks([t, 0, EXPO], [t + 0.8, 180, "hold"], [t + 1.8, 180, EXPO], [t + 2.6, 360]) }), { mode: "alternate", stretch: 0.6, skew: 14 }, (l) => l.tool === "text"),
];

// ---------------------------------------------------------------- Motion Builder templates

const MB_EASE: Record<string, Ease> = { linear: "linear", in: "in", out: "out", inOut: "ease", expo: EXPO, back: BACK, hold: "hold" };
const mbKeys = (keys: AnimationKey[], l: Layer): Track => {
  const len = l.outPoint - l.inPoint;
  return { keys: keys.map(([u, v, e]) => ({ id: uid(), t: l.inPoint + u * len, v, ease: MB_EASE[e ?? "inOut"] ?? "ease" }) as Key) };
};

/** Each Motion Builder tool's own templates, spread over the layer's length as in Motion Builder. */
export const MB_TEMPLATES: Template[] = MB_TOOLS.flatMap((d) =>
  Object.entries(d.animations ?? {}).map(([name, a]) => ({
    id: `mb:${d.id}:${name}`,
    name: `${d.name}: ${name}`,
    fits: (l: Layer) => l.tool === `mb:${d.id}`,
    apply(p: Project, layerId: string) {
      const l = layerOf(p, layerId);
      let out = p;
      for (const [k, v] of Object.entries(a.values ?? {})) out = setTrack(out, { layer: l.id, group: "params", param: k }, { value: v });
      for (const [k, keys] of Object.entries(a.tracks ?? {})) out = setTrack(out, { layer: l.id, group: "params", param: k }, mbKeys(keys, l));
      if (a.opacity) out = setTrack(out, T(l, "opacity"), mbKeys(a.opacity, l));
      if (a.zoom) out = setTrack(out, T(l, "scale"), mbKeys(a.zoom, l));
      return out;
    },
  })),
);

export const TEMPLATES: Record<string, Template> = Object.fromEntries([...STUDIO_TEMPLATES, ...MB_TEMPLATES].map((t) => [t.id, t]));

/**
 * Whole-comp choreography: every layer gets a template by type, staggered. The Motion, Now
 * "KV entrance" is the poster's own; it works on any comp.
 */
export function entrance(p: Project, t0 = 0): Project {
  const byType = (l: Layer): string | null =>
    l.tool === "kv-paper" ? null : l.tool === "text" ? "pixel-build" : l.tool === "rect" ? "slide-up" : l.tool === "polygon" ? "pin-land" : "pop";
  let out = p;
  p.layers.forEach((l, i) => {
    const id = byType(l);
    if (id) out = TEMPLATES[id].apply(out, l.id, t0 + i * 0.18);
  });
  return out;
}
