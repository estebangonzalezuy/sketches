import { FORMATS, TEMPLATES } from "./data";
import { approxMeasure, lockup, mark, type Measure } from "./elements";
import { LAYOUTS, type Frame } from "./layouts";
import { cuts } from "./mosaic";
import { rng } from "./random";
import type { FormatId, Poster, Template } from "./types";

export interface GenOptions {
  template: (typeof TEMPLATES)[number];
  seed: number;
  format: FormatId;
  density: number;
}

/** The layout a seed resolves to ("auto" picks one per seed). */
export function resolveTemplate(o: GenOptions): Template {
  if (o.template !== "auto") return o.template;
  const all = TEMPLATES.filter((t) => t !== "auto") as Template[];
  return all[Math.floor(rng(o.seed * 7 + 3)() * all.length)];
}

export function frameOf(width: number, height: number): Frame {
  const m = Math.round(width * 0.045);
  return { W: width, H: height, m, x: m, y: m, w: width - 2 * m, h: height - 2 * m };
}

/** Seed + options → a full poster. Pure: same input, same poster. */
export function generate(o: GenOptions, measure: Measure = approxMeasure): Poster {
  const { width, height } = FORMATS[o.format];
  const r = rng(o.seed);
  const f = frameOf(width, height);
  const t = resolveTemplate(o);
  const body = LAYOUTS[t](f, r, o.density, measure);
  const lk = Math.round(width * 0.058);
  const ms = Math.round(width * 0.075);
  return {
    version: 1,
    format: o.format,
    width,
    height,
    line: t === "line",
    grid: { xs: cuts(r, r.int(6, 9)), ys: cuts(r, r.int(8, 12)) },
    elements: [
      ...body,
      lockup(f.x + width * 0.015, f.y + f.h - lk * 2.6, lk),
      mark(f.x + f.w - ms * 1.15, f.y + f.h - ms * 1.15, ms, t === "cascade" ? "brown" : "ink"),
    ],
  };
}
