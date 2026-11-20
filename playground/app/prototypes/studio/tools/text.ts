import { getFont, HEADLINE_FONTS } from "@/lib/kv/fonts";
import type { FontId } from "@/lib/kv/model";
import { flatPieces, octilinear, toPieces } from "@/lib/kv/render/outline";
import { bboxOf, mapPaths, type Pt, type ShapePath } from "../engine/geometry";
import type { GeneratorDef } from "./types";

const FONT_OPTIONS = (Object.keys(HEADLINE_FONTS) as FontId[]).map((id) => ({ value: id, label: HEADLINE_FONTS[id].label }));

/** Glyph outlines → contours, one list per glyph (so per-letter effects can move each letter). KV facets cut curves to 0/45/90°. */
export function textContours(o: { text: string; font: string; size: number; tracking: number; leading: number; scaleX: number; align: string; facets: number }): Pt[][][] {
  const font = getFont(o.font as FontId);
  const em = o.size / font.unitsPerEm;
  const steps = Math.max(6, Math.min(24, Math.round(o.size / 30)));
  const out: Pt[][][] = [];
  o.text.split("\n").forEach((line, li) => {
    const base = li * o.leading * o.size;
    const glyphs = [...line].map((ch) => font.charToGlyph(ch));
    const pens: number[] = [];
    let pen = 0;
    glyphs.forEach((g, i) => {
      if (i > 0) pen += font.getKerningValue(glyphs[i - 1], g) * em * o.scaleX;
      pens.push(pen);
      pen += (g.advanceWidth ?? 0) * em * o.scaleX + o.tracking * o.size;
    });
    const width = pen - (glyphs.length ? o.tracking * o.size : 0);
    const off = o.align === "center" ? -width / 2 : o.align === "right" ? -width : 0;
    glyphs.forEach((g, i) => {
      const cmds = g.getPath(0, 0, o.size).commands;
      const pieces = toPieces(cmds, steps, (x, y) => [off + pens[i] + x * o.scaleX, base + y]);
      const glyph: Pt[][] = [];
      for (const pc of pieces) {
        const ct = o.facets > 0 ? octilinear(pc, o.facets, o.size) : flatPieces(pc);
        if (ct.length >= 3) glyph.push(ct);
      }
      if (glyph.length) out.push(glyph);
    });
  });
  return out;
}

const cache = new Map<string, ShapePath[]>();

export const text: GeneratorDef = {
  id: "text",
  name: "Text",
  engine: "vector",
  params: {
    text: { kind: "text", label: "Text", default: "Motion, Now" },
    font: { kind: "select", label: "Font", default: "barlow700", options: FONT_OPTIONS },
    size: { kind: "number", label: "Size", default: 240, min: 8, max: 1200, step: 1, unit: "px" },
    scaleX: { kind: "number", label: "Width", default: 1, min: 0.3, max: 3, step: 0.01 },
    tracking: { kind: "number", label: "Tracking", default: -0.02, min: -0.3, max: 1, step: 0.005 },
    leading: { kind: "number", label: "Leading", default: 0.9, min: 0.5, max: 2, step: 0.01 },
    align: { kind: "select", label: "Align", default: "left", options: [{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }] },
    facets: { kind: "number", label: "KV facets", default: 0, min: 0, max: 1, step: 0.01 },
    fill: { kind: "color", label: "Fill", default: "#141313" },
  },
  generate(p) {
    const o = { text: String(p.text), font: String(p.font), size: Number(p.size), tracking: Number(p.tracking), leading: Number(p.leading), scaleX: Number(p.scaleX), align: String(p.align), facets: Number(p.facets) };
    const key = JSON.stringify(o);
    let shape = cache.get(key);
    if (!shape) {
      const raw: ShapePath[] = textContours(o).map((contours) => ({ fill: "", contours }));
      const b = bboxOf(raw);
      shape = mapPaths(raw, ([x, y]) => [x - b.x - b.w / 2, y - b.y - b.h / 2]);
      if (cache.size > 200) cache.clear();
      cache.set(key, shape);
    }
    const fill = String(p.fill);
    return { kind: "vector", paths: shape.map((g) => ({ fill, contours: g.contours })) };
  },
};
