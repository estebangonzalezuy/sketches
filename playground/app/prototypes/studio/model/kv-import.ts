import type { Composition, Layer as KvLayer } from "@/lib/kv/model";
import { layerBounds } from "@/lib/kv/render/render";
import { typeGeometry } from "@/lib/kv/render/type";
import { newLayer } from "./project";
import type { Layer, Project } from "./types";

const centre = (l: KvLayer): [number, number] => {
  const b = layerBounds(l);
  return [b.x + b.w / 2, b.y + b.h / 2];
};

/**
 * A KV poster as studio layers. Blocks, the bracket and headlines become vector layers (so
 * shape effects work on them); everything else keeps the KV's own drawing as a bitmap.
 */
export function kvToLayers(c: Composition, project: Pick<Project, "width" | "height" | "duration">): Layer[] {
  const shell = { ...c, layers: [] };
  const col = (t: string) => c.palette[t as keyof typeof c.palette] ?? "#ff00ff";
  const out: Layer[] = [newLayer(project, "kv-paper", { name: "Paper", params: { kv: JSON.stringify({ comp: shell }) } })];
  for (const l of c.layers) {
    if (!l.visible || l.type === "media") continue;
    if (l.type === "block") {
      out.push(newLayer(project, "rect", { name: l.name, position: centre(l), params: { size: [l.w, l.h], fill: col(l.fill) } }));
    } else if (l.type === "bracket") {
      const [cx, cy] = centre(l);
      const top = l.corner === "ne" || l.corner === "nw";
      const right = l.corner === "ne" || l.corner === "se";
      const r = (x: number, y: number, w: number, h: number) => [[x - cx, y - cy], [x + w - cx, y - cy], [x + w - cx, y + h - cy], [x - cx, y + h - cy]];
      const bar = r(l.x, top ? l.y : l.y + l.h - l.barH, l.w, l.barH);
      const leg = r(right ? l.x + l.w - l.legW : l.x, l.y, l.legW, l.h);
      out.push(newLayer(project, "polygon", { name: l.name, position: [cx, cy], params: { contours: JSON.stringify([bar, leg]), fill: col(l.fill) } }));
    } else if (l.type === "headline") {
      const g = typeGeometry(l);
      out.push(
        newLayer(project, "text", {
          name: l.name,
          position: [l.x + g.bbox.x + g.bbox.w / 2, l.y + g.bbox.y + g.bbox.h / 2],
          params: { text: l.text, font: l.font, size: l.size, scaleX: l.scaleX, tracking: l.tracking, leading: l.leading, align: l.align, facets: l.treatment === "kv" ? l.chamfer : 0, fill: col(l.fill) },
        }),
      );
    } else {
      out.push(newLayer(project, "kv-layer", { name: l.name, position: centre(l), params: { kv: JSON.stringify({ layer: l, comp: shell }) } }));
    }
  }
  return out;
}
