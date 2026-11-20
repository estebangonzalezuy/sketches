import type { Layer, Project } from "../model/types";
import { EFFECTS, GENERATORS } from "../tools/registry";
import type { ToolCtx } from "../tools/types";
import { paramsAt, transformAt } from "./evaluate";
import { contentBox, type Content, type Rect } from "./geometry";
import { rasterize } from "./raster";

export type LayerResult = {
  content: Content;
  /** the content box each effect received, by effect id (for its handles) */
  boxes: Map<string, Rect>;
  /** effects that couldn't run on this content (a vector-only effect after a raster stage) */
  skipped: Set<string>;
};

/**
 * A layer's content at time t, in layer space: the generator, then each enabled effect in
 * order. Vector stays vector while it can; a raster-only effect rasterises it first.
 */
export function layerContent(project: Project, l: Layer, t: number, scale: number): LayerResult {
  const gen = GENERATORS[l.tool];
  const boxes = new Map<string, Rect>();
  const skipped = new Set<string>();
  if (!gen) return { content: { kind: "vector", paths: [] }, boxes, skipped };
  const tv = transformAt(l, t);
  const res = scale * Math.max(0.05, Math.abs(tv.scale));
  const ctx = (slot: string): ToolCtx => ({ time: t, local: t - l.inPoint, scale: res, width: project.width, height: project.height, slot });
  let content = gen.generate(paramsAt(l.params, t), ctx(l.id));
  for (const e of l.effects) {
    if (!e.enabled) continue;
    const def = EFFECTS[e.tool];
    if (!def) continue;
    boxes.set(e.id, contentBox(content));
    const p = paramsAt(e.params, t);
    if (content.kind === "vector" && def.vector) content = { kind: "vector", paths: def.vector(content.paths, p, ctx(e.id)) };
    else if (def.raster) {
      const r = content.kind === "raster" ? content : rasterize(content.paths, res);
      content = def.raster(r, p, ctx(`${l.id}/${e.id}`));
    } else skipped.add(e.id);
  }
  return { content, boxes, skipped };
}
