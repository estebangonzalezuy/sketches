import type { Layer, ParamPath, Project, Track } from "./types";

export const pathId = (p: ParamPath) =>
  p.group === "effect" ? `${p.layer}/fx/${p.effect}/${p.param}` : `${p.layer}/${p.group}/${p.param}`;

export function getTrack(project: Project, p: ParamPath): Track | undefined {
  const l = project.layers.find((x) => x.id === p.layer);
  if (!l) return undefined;
  if (p.group === "transform") return l.transform[p.param];
  if (p.group === "params") return l.params[p.param];
  return l.effects.find((e) => e.id === p.effect)?.params[p.param];
}

/** Returns a new project with the track at `p` replaced. Untouched layers keep their identity. */
export function setTrack(project: Project, p: ParamPath, track: Track): Project {
  return mapLayer(project, p.layer, (l) => {
    if (p.group === "transform") return { ...l, transform: { ...l.transform, [p.param]: track } };
    if (p.group === "params") return { ...l, params: { ...l.params, [p.param]: track } };
    return { ...l, effects: l.effects.map((e) => (e.id === p.effect ? { ...e, params: { ...e.params, [p.param]: track } } : e)) };
  });
}

export function mapLayer(project: Project, id: string, fn: (l: Layer) => Layer): Project {
  return { ...project, layers: project.layers.map((l) => (l.id === id ? fn(l) : l)) };
}

/** Every track in a layer with its path, in timeline order: transform, generator params, effects. */
export function layerTracks(l: Layer): { path: ParamPath; track: Track }[] {
  const out: { path: ParamPath; track: Track }[] = [];
  for (const [param, track] of Object.entries(l.transform))
    out.push({ path: { layer: l.id, group: "transform", param: param as keyof Layer["transform"] }, track });
  for (const [param, track] of Object.entries(l.params)) out.push({ path: { layer: l.id, group: "params", param }, track });
  for (const e of l.effects)
    for (const [param, track] of Object.entries(e.params)) out.push({ path: { layer: l.id, group: "effect", effect: e.id, param }, track });
  return out;
}
