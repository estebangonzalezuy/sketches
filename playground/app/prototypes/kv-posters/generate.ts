import { FORMATS, TEMPLATES } from "./data";
import { approxMeasure, lockup, mark, type Measure } from "./elements";
import { LAYOUTS, type Frame } from "./layouts";
import { cuts, paintSquares } from "./mosaic";
import { rng } from "./random";
import { vary } from "./vary";
import type { Element, FormatId, Paint, Poster, Template } from "./types";

export interface GenOptions {
  template: (typeof TEMPLATES)[number];
  seed: number;
  format: FormatId;
  density: number;
  paint: Paint;
}

/** The layout a seed resolves to ("auto" picks one per seed). */
export function resolveTemplate(o: GenOptions): Template {
  if (o.template !== "auto") return o.template;
  const all = TEMPLATES.filter((t) => t !== "auto") as Template[];
  return all[Math.floor(rng(o.seed * 7 + 3)() * all.length)];
}

export function frameOf(width: number, height: number): Frame {
  const m = Math.round(width * 0.045);
  return { W: width, H: height, m, x: m, y: m, w: width - 2 * m, h: height - 2 * m, U: Math.min(width, height * 0.75) };
}

/** Seed + options → a full poster. Pure: same input, same poster. */
export function generate(o: GenOptions, measure: Measure = approxMeasure): Poster {
  const { width, height } = FORMATS[o.format];
  const r = rng(o.seed);
  const f = frameOf(width, height);
  const t = resolveTemplate(o);
  let body = LAYOUTS[t](f, r, o.density, measure);
  if (t !== "line") body = vary(body, r, f, measure);
  const squares = o.paint === "squares" && t !== "line";
  if (squares) body = [...paintSquares(r, f, width, o.density), ...body.filter((e) => e.kind !== "block" && e.kind !== "bands").map(outlined)];
  const lk = Math.round(f.U * r.range(0.05, 0.066));
  const ms = Math.round(f.U * r.range(0.06, 0.09));
  const swap = r.chance(0.35);
  const lockupEl = lockup(f.x + width * 0.015, f.y + f.h - lk * 2.6, lk);
  const markEl = { ...mark(f.x + f.w - ms * 1.15, f.y + f.h - ms * 1.15, ms, squares || t === "cascade" ? "brown" : "ink"), box: !squares, round: r.chance(0.7) ? 1 : r.range(0, 0.6), ...(squares ? { size: ms * 1.6, cx: f.x + f.w - ms * 1.7, cy: f.y + f.h - ms * 1.7 } : {}) };
  if (swap) {
    // asterisk bottom-left, lockup bottom-right
    const lw = lk * 7.4;
    lockupEl.x = f.x + f.w - lw;
    markEl.cx = f.x + (f.x + f.w - markEl.cx);
  }
  const boxes = (e: Element): Element => (e.kind === "headline" || e.kind === "lockup" || e.kind === "mark" ? { ...e, boxLine: r.chance(0.55) } : e);
  return {
    version: 1,
    format: o.format,
    width,
    height,
    line: t === "line",
    paint: squares ? "squares" : "fills",
    grid: { xs: cuts(r, r.int(6, 9)), ys: cuts(r, r.int(8, 12)) },
    elements: [...body, lockupEl, markEl].map(boxes),
  };
}

/** Squares mode: rosettes become scalloped outlines, the headline loses its box. */
function outlined(e: Element): Element {
  if (e.kind === "flower") return { ...e, style: "scallop", petals: Math.max(12, e.petals + 4), r: e.r * 1.15 };
  if (e.kind === "headline") return { ...e, box: false };
  return e;
}
