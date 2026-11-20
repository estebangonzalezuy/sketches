import { tools as MB_TOOLS } from "@/lib/motion-builder/tools";
import type { ParamSpec as MbSpec, ToolDefinition } from "@/lib/motion-builder/core/tool";
import { runMb } from "../engine/mb-host";
import type { ParamSpecs, Spec } from "../model/types";
import type { EffectDef, GeneratorDef, ToolCtx } from "./types";

/** KMR Apparat is commercial and not in the repo: default to the first free family instead. */
const FREE = ["Archivo Narrow", "Geist Mono", "IBM Plex Mono"];

function spec(id: string, s: MbSpec): Spec {
  const label = s.label ? s.label[0].toUpperCase() + s.label.slice(1) : id;
  const hidden = s.hidden;
  switch (s.kind) {
    case "number":
      return { kind: "number", label, default: s.default, min: s.min, max: s.max, step: s.step, hidden };
    case "vec2":
      return { kind: "vec2", label, default: s.default, step: (s.max - s.min) / 200, hidden };
    case "color":
      return { kind: "color", label, default: s.default.toLowerCase(), hidden };
    case "boolean":
      return { kind: "boolean", label, default: s.default, hidden };
    case "text":
      return { kind: "text", label, default: s.default, hidden };
    case "select": {
      const def = s.default === "KMR Apparat" ? (s.options.find((o) => FREE.includes(o)) ?? s.default) : s.default;
      return { kind: "select", label, default: def, options: s.options.map((o) => ({ value: o, label: o })), hidden };
    }
  }
}

const specsOf = (d: ToolDefinition): ParamSpecs => Object.fromEntries(Object.entries(d.params).map(([k, s]) => [k, spec(k, s)]));
const seedOf = (slot: string) => [...slot].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 100000;

function run(d: ToolDefinition, p: Record<string, unknown>, ctx: ToolCtx, w: number, h: number, input?: HTMLCanvasElement | OffscreenCanvas) {
  return runMb(d, p as never, { slot: ctx.slot, width: w, height: h, time: ctx.local, fps: ctx.fps, duration: ctx.duration, seed: seedOf(ctx.slot), integral: ctx.integral, input });
}

/** A Motion Builder generator: renders the full comp frame, centred on the layer origin. */
function generator(d: ToolDefinition): GeneratorDef {
  return {
    id: `mb:${d.id}`,
    name: d.name,
    engine: "gl",
    params: specsOf(d),
    generate(p, ctx) {
      const s = Math.min(ctx.scale, 1);
      const cv = run(d, p, ctx, ctx.width * s, ctx.height * s);
      if (!cv) return { kind: "vector", paths: [] };
      return { kind: "raster", canvas: cv, rect: { x: -ctx.width / 2, y: -ctx.height / 2, w: ctx.width, h: ctx.height } };
    },
  };
}

/** A Motion Builder effect: the layer's bitmap is its source input; the output keeps the same box. */
function effect(d: ToolDefinition, id = `mb:${d.id}`, name = d.name): EffectDef {
  return {
    id,
    name,
    params: specsOf(d),
    raster(c, p, ctx) {
      const cv = run(d, p, ctx, c.canvas.width, c.canvas.height, c.canvas);
      return cv ? { kind: "raster", canvas: cv, rect: c.rect } : c;
    },
  };
}

export const MB_GENERATORS: GeneratorDef[] = MB_TOOLS.filter((d) => d.kind !== "effect").map(generator);
export const MB_EFFECTS: EffectDef[] = [
  ...MB_TOOLS.filter((d) => d.kind === "effect").map((d) => effect(d)),
  // Tag Shader is hybrid: a generator on its own, and an effect that takes the layer as source
  ...MB_TOOLS.filter((d) => d.kind === "hybrid").map((d) => effect(d, `mb:${d.id}:fx`, `${d.name} (on layer)`)),
];
