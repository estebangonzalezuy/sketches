import type { Composition, Layer as KvLayer, Token } from "@/lib/kv/model";
import { drawCrosses, drawPaper } from "@/lib/kv/render/paper";
import { drawLayer, layerBounds } from "@/lib/kv/render/render";
import type { RasterContent } from "../engine/geometry";
import type { GeneratorDef, ToolCtx } from "./types";

type KvData = { layer: KvLayer; comp: Composition };

const parsed = new Map<string, KvData | null>();
function read(json: string): KvData | null {
  if (!parsed.has(json)) {
    try {
      parsed.set(json, JSON.parse(json) as KvData);
    } catch {
      parsed.set(json, null);
    }
  }
  return parsed.get(json)!;
}

const bitmaps = new Map<string, RasterContent>();
function cached(key: string, make: () => RasterContent): RasterContent {
  let r = bitmaps.get(key);
  if (!r) {
    if (bitmaps.size > 60) bitmaps.clear();
    bitmaps.set(key, (r = make()));
  }
  return r;
}

/**
 * One layer of a KV poster (asterisk, grid, lockup, clean text…) drawn by the KV render,
 * as a bitmap centred on the layer origin. The layer's own look stays exactly the editor's.
 */
export const kvLayer: GeneratorDef = {
  id: "kv-layer",
  name: "KV layer",
  engine: "raster",
  params: { kv: { kind: "text", label: "KV layer", default: "", hidden: true } },
  generate(p, ctx: ToolCtx) {
    const json = String(p.kv);
    const d = read(json);
    if (!d) return { kind: "vector", paths: [] };
    const s = ctx.scale;
    return cached(`${ctx.slot}|${s}|${json.length}|${json.slice(-48)}`, () => {
      const b = layerBounds(d.layer);
      const m = Math.max(8, Math.max(b.w, b.h) * 0.06);
      const rect = { x: -b.w / 2 - m, y: -b.h / 2 - m, w: b.w + 2 * m, h: b.h + 2 * m };
      const cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.ceil(rect.w * s));
      cv.height = Math.max(1, Math.ceil(rect.h * s));
      const g = cv.getContext("2d")!;
      // KV comp px → this bitmap: the layer's box centre lands on the layer origin
      g.setTransform(s, 0, 0, s, (-b.x - b.w / 2 - rect.x) * s, (-b.y - b.h / 2 - rect.y) * s);
      const col = (t: Token) => d.comp.palette[t] ?? "#ff00ff";
      drawLayer(g, d.layer, d.comp, s, col);
      return { kind: "raster", canvas: cv, rect };
    });
  },
};

/** The KV paper: flat colour with seeded grain and mottle, plus the + crosses. Fills the comp. */
export const kvPaper: GeneratorDef = {
  id: "kv-paper",
  name: "KV paper",
  engine: "raster",
  params: { kv: { kind: "text", label: "KV paper", default: "", hidden: true } },
  generate(p, ctx) {
    const json = String(p.kv);
    const d = read(json);
    if (!d) return { kind: "vector", paths: [] };
    const c = d.comp;
    const s = ctx.scale;
    return cached(`paper|${s}|${json.length}|${json.slice(-48)}`, () => {
      const cv = document.createElement("canvas");
      cv.width = Math.ceil(c.width * s);
      cv.height = Math.ceil(c.height * s);
      const g = cv.getContext("2d")!;
      g.setTransform(s, 0, 0, s, 0, 0);
      drawPaper(g, c, s);
      if (c.crosses.visible) drawCrosses(g, c, s);
      return { kind: "raster", canvas: cv, rect: { x: -c.width / 2, y: -c.height / 2, w: c.width, h: c.height } };
    });
  },
};
