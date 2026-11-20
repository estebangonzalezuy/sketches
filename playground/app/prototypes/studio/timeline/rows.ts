import { isAnimated } from "../model/tracks";
import { TRANSFORM_SPECS } from "../model/transform-specs";
import type { Layer, ParamPath, Project, Spec, Track, TransformTracks } from "../model/types";
import { EFFECTS, GENERATORS } from "../tools/registry";

export type Row =
  | { kind: "layer"; id: string; layer: Layer }
  | { kind: "group"; id: string; label: string; depth: number; layer: Layer }
  | { kind: "param"; id: string; path: ParamPath; spec: Spec; track: Track; depth: number; layer: Layer };

/**
 * The timeline's rows, top to bottom, like After Effects: front layer first, each with
 * twirl-down groups (Transform, Contents, Effects → each effect). "Animated only" (U) keeps
 * just the properties that have keys, already expanded.
 */
export function buildRows(project: Project, open: Set<string>, animatedOnly: boolean): Row[] {
  const rows: Row[] = [];
  for (const l of [...project.layers].reverse()) {
    rows.push({ kind: "layer", id: l.id, layer: l });
    if (!open.has(l.id) && !animatedOnly) continue;
    const params = (group: string, label: string, depth: number, items: { path: ParamPath; spec: Spec; track: Track }[]) => {
      const shown = items.filter((x) => !x.spec.hidden && (!animatedOnly || isAnimated(x.track)));
      if (!shown.length) return;
      const gid = `${l.id}/${group}`;
      rows.push({ kind: "group", id: gid, label, depth, layer: l });
      if (!open.has(gid) && !animatedOnly) return;
      for (const x of shown) rows.push({ kind: "param", id: `${gid}/${"param" in x.path ? x.path.param : ""}`, ...x, depth: depth + 1, layer: l });
    };
    params("transform", "Transform", 1, (Object.keys(TRANSFORM_SPECS) as (keyof TransformTracks)[]).map((k) => ({ path: { layer: l.id, group: "transform", param: k }, spec: TRANSFORM_SPECS[k], track: l.transform[k] })));
    const gen = GENERATORS[l.tool];
    if (gen) params("contents", "Contents", 1, Object.entries(gen.params).map(([k, spec]) => ({ path: { layer: l.id, group: "params", param: k }, spec, track: l.params[k] })));
    for (const fx of l.effects) {
      const def = EFFECTS[fx.tool];
      if (def) params(`fx/${fx.id}`, def.name, 1, Object.entries(def.params).map(([k, spec]) => ({ path: { layer: l.id, group: "effect", effect: fx.id, param: k }, spec, track: fx.params[k] })));
    }
  }
  return rows;
}

/** 2:15 = 2 s 15 frames, After Effects' timecode without hours and minutes. */
export function timecode(t: number, fps: number) {
  const f = Math.round(t * fps);
  return `${Math.floor(f / fps)}:${String(f % fps).padStart(2, "0")}`;
}
