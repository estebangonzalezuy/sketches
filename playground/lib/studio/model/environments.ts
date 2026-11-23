import { demoProject } from "./demo";
import { FX_DEMOS } from "./fx-demos";
import { emptyProject, newLayer } from "./project";
import type { Project } from "./types";

/**
 * An environment decides which tools and templates a project offers, like in Motion Builder.
 * Every tool stays registered: an environment filters what you can add, not what can open.
 */
export type Environment = {
  id: string;
  name: string;
  generators: string[];
  effects: string[] | "all";
  /** a pool, or exact template ids (mini tools) */
  templates: "studio" | "mb" | "all" | string[];
  create: () => Project;
};

const SHAPE_FX = ["corner-pin", "pixel-shape", "radial-warp", "letters", "wave"];
const INCEPTION = ["mb:text", "mb:tag-shader", "mb:text-extruder", "mb:chart", "mb:table", "mb:counter"];
const SPRAY = ["mb:una-palabra", "mb:dato-grande", "mb:cruce", "mb:campo-partido", "mb:grano-papel", "mb:orbita", "mb:dither-field"];

function starter(name: string, env: string, tools: [string, string][]): Project {
  const p = { ...emptyProject(), name, environment: env, background: "#f8f6ee" };
  return { ...p, layers: tools.map(([tool, n]) => newLayer(p, tool, { name: n })) };
}

export const ENVIRONMENTS: Environment[] = [
  { id: "motion-now", name: "Motion, Now", generators: ["text", "rect", "shader-field"], effects: [...SHAPE_FX, "mb:pixelate", "mb:ascii"], templates: "studio", create: () => ({ ...demoProject(), environment: "motion-now" }) },
  {
    id: "inception",
    name: "Inception",
    generators: INCEPTION,
    effects: ["mb:pixelate", "mb:ascii", "mb:tag-shader:fx", ...SHAPE_FX],
    templates: "all",
    create: () => starter("Inception", "inception", [["mb:tag-shader", "Tag Shader"]]),
  },
  { id: "spray", name: "Spray", generators: SPRAY, effects: ["mb:spray", "mb:pixelate"], templates: "all", create: () => starter("Spray", "spray", [["mb:una-palabra", "Una Palabra"]]) },
  // mini tools: one effect each, on text or a rectangle (app/prototypes/<effect>)
  ...FX_DEMOS.map((d) => ({ id: `fx:${d.effect}`, name: d.name, generators: ["text", "rect"], effects: [d.effect], templates: d.templates, create: d.create })),
  { id: "free", name: "Free", generators: [], effects: "all", templates: "all", create: () => ({ ...emptyProject(), name: "Untitled", environment: "free" }) },
];

export const environmentOf = (p: Project) => ENVIRONMENTS.find((e) => e.id === (p.environment ?? "motion-now")) ?? ENVIRONMENTS[0];
