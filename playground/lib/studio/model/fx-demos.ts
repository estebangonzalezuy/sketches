import { uid } from "./ops";
import { emptyProject, newEffect, newLayer } from "./project";
import { TEMPLATES } from "./templates";
import type { Layer, Project, Track, Value } from "./types";

/** A mini tool: one effect, its templates, and the demo it opens with. */
export type FxDemo = { effect: string; name: string; templates: string[]; create: () => Project };

const BASIC = ["fade-in", "slide-up", "pop", "spin-in"];

function comp(name: string, effect: string, background: string, texts: { text: string; at?: [number, number]; params?: Record<string, Value> }[], animate: (p: Project, layers: Layer[]) => Project): Project {
  const base = { ...emptyProject(), name, background, environment: `fx:${effect}` };
  const layers = texts.map((t) => newLayer(base, "text", { name: t.text.replace(/\n/g, " "), position: t.at, params: { text: t.text, ...t.params } }));
  return animate({ ...base, layers }, layers);
}
const run = (p: Project, layer: Layer, ...steps: [string, number][]) => steps.reduce((acc, [id, t]) => TEMPLATES[id].apply(acc, layer.id, t), p);

const k = (...keys: [number, Value][]): Track => ({ keys: keys.map(([t, v]) => ({ id: uid(), t, v, ease: "ease" })) });

/**
 * Two words on concentric rings around one centre, like a radial type poster: each layer's
 * warp centre is the shared ring centre, written in that layer's own space. They bend in from
 * flat, then the rings turn.
 */
function radialDemo(): Project {
  const ring: [number, number] = [1115, 720];
  const words: { text: string; at: [number, number]; size: number; inner: number; depth: number; angle: number; sweep: number; t: number }[] = [
    { text: "SETUP", at: [760, 300], size: 260, inner: 120, depth: 220, angle: 215, sweep: 130, t: 0.2 },
    { text: "RADIAL", at: [760, 780], size: 280, inner: 380, depth: 260, angle: 155, sweep: 95, t: 0.5 },
  ];
  const base = { ...emptyProject(), name: "Radial Warp", background: "#f8f6ee", environment: "fx:radial-warp" };
  const layers = words.map((w) => {
    const l = newLayer(base, "text", { name: w.text, position: w.at, params: { text: w.text, font: "archivo", size: w.size, scaleX: 0.78, fill: "#141313" } });
    const fx = newEffect("radial-warp", { center: [ring[0] - w.at[0], ring[1] - w.at[1]], inner: w.inner, depth: w.depth, sweep: w.sweep });
    fx.params.amount = k([w.t, 0], [w.t + 1.4, 1]);
    fx.params.angle = k([w.t + 1.4, w.angle], [6, w.angle + 25]);
    return { ...l, effects: [fx] };
  });
  return { ...base, layers };
}

export const FX_DEMOS: FxDemo[] = [
  {
    effect: "corner-pin",
    name: "Corner Pin",
    templates: ["pin-land", "pin-swing", ...BASIC],
    create: () =>
      comp("Corner Pin", "corner-pin", "#f5e85a", [{ text: "Motion, Now", params: { font: "barlow700", size: 280, facets: 0.9, fill: "#141313" } }], (p, [l]) =>
        run(p, l, ["pin-land", 0.2], ["pin-swing", 1.8]),
      ),
  },
  {
    effect: "pixel-shape",
    name: "Pixel (shape)",
    templates: ["pixel-build", "pixel-pulse", ...BASIC],
    create: () =>
      comp("Pixel (shape)", "pixel-shape", "#fb81bc", [{ text: "Pixel", params: { font: "barlow", size: 520, fill: "#141313" } }], (p, [l]) =>
        run(p, l, ["pixel-build", 0], ["pixel-pulse", 1.8]),
      ),
  },
  {
    effect: "radial-warp",
    name: "Radial Warp",
    templates: ["radial-unbend", "radial-turn", ...BASIC],
    create: radialDemo,
  },
  {
    effect: "letters",
    name: "Letters",
    templates: ["hard-work", "letters-wave", ...BASIC],
    create: () =>
      comp("Letters", "letters", "#141313", [{ text: "Hard\nWork", params: { font: "narrow", size: 340, leading: 0.85, fill: "#f8f6ee" } }], (p, [l]) =>
        run(p, l, ["hard-work", 0.3], ["hard-work", 3.2]),
      ),
  },
  {
    effect: "wave",
    name: "Wave",
    templates: ["wave-in", ...BASIC],
    create: () =>
      comp("Wave", "wave", "#bfa1ef", [{ text: "Wave", params: { font: "barlow", size: 460, fill: "#141313" } }], (p, [l]) => run(p, l, ["wave-in", 0.2])),
  },
];
