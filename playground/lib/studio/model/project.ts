import { EFFECTS, GENERATORS } from "../tools/registry";
import { uid } from "./ops";
import type { EffectInstance, Layer, ParamSpecs, Project, Track, Value } from "./types";

export const fixed = (value: Value): Track => ({ value });

export function defaultTracks(specs: ParamSpecs, over: Record<string, Value> = {}): Record<string, Track> {
  return Object.fromEntries(Object.entries(specs).map(([k, s]) => [k, fixed(over[k] ?? s.default)]));
}

export function newLayer(project: Pick<Project, "width" | "height" | "duration">, tool: string, o: { name?: string; params?: Record<string, Value>; position?: [number, number] } = {}): Layer {
  const gen = GENERATORS[tool];
  return {
    id: uid("l"),
    name: o.name ?? gen.name,
    tool,
    visible: true,
    inPoint: 0,
    outPoint: project.duration,
    blend: "source-over",
    transform: {
      position: fixed(o.position ?? [project.width / 2, project.height / 2]),
      anchor: fixed([0, 0]),
      scale: fixed(1),
      rotation: fixed(0),
      opacity: fixed(1),
    },
    params: defaultTracks(gen.params, o.params),
    effects: [],
  };
}

export function newEffect(tool: string, over: Record<string, Value> = {}): EffectInstance {
  return { id: uid("e"), tool, enabled: true, params: defaultTracks(EFFECTS[tool].params, over) };
}

export function emptyProject(width = 1920, height = 1080): Project {
  return { version: 1, name: "Untitled", width, height, fps: 30, duration: 6, background: "#f5e85a", layers: [] };
}

/** Loads a saved project, or explains why not. */
export function validateProject(raw: unknown): Project {
  const p = raw as Project;
  if (!p || p.version !== 1 || !Array.isArray(p.layers)) throw new Error("Not a Studio project (version 1).");
  for (const l of p.layers) if (!GENERATORS[l.tool]) throw new Error(`Unknown tool: ${l.tool}`);
  return p;
}
