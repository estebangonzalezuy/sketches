import { FORMATS, TEMPLATES } from "./data";
import { approxMeasure, lockup, mark, type Measure } from "./elements";
import { LAYOUTS, type Frame } from "./layouts";
import { cuts, paintSquares } from "./mosaic";
import { rng, type Rng } from "./random";
import { vary } from "./vary";
import type { Element, FormatId, Headline, Lockup, Mark, Paint, Poster, Template } from "./types";

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
  const markEl = { ...mark(0, 0, ms, squares || t === "cascade" ? "brown" : "ink"), box: !squares, round: r.chance(0.7) ? 1 : r.range(0, 0.6), ...(squares ? { size: ms * 1.6 } : {}) };
  const { lockupEl } = placeCorners(body, f, r, lk, markEl, measure);
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
type Rect = { x: number; y: number; w: number; h: number };
const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const CORNERS = ["bl", "br", "tl", "tr"] as const;

/** Lockup and asterisk go to two different random corners, clear of the headline; the lockup's box is a coin flip. */
function placeCorners(body: Element[], f: Frame, r: Rng, lk: number, markEl: Mark, measure: Measure): { lockupEl: Lockup } {
  const lw = lk * 7.4;
  const lh = lk * 2.6;
  const d = markEl.size * (markEl.box ? 2.3 : 2.1);
  const head = body.find((e): e is Headline => e.kind === "headline");
  const hb: Rect | null = head
    ? (() => {
        const b = measure(head.text, head.size);
        const [w, h] = head.vertical ? [b.h, b.w] : [b.w, b.h];
        const pad = head.size * 0.25;
        return { x: head.x - pad, y: head.y - pad, w: w + pad * 2, h: h + pad * 2 };
      })()
    : null;
  const inset = () => r.range(0, f.U * 0.03);
  const at = (c: (typeof CORNERS)[number], w: number, h: number): Rect => {
    const x = c[1] === "l" ? f.x + inset() : f.x + f.w - w - inset();
    const y = c[0] === "t" ? f.y + inset() : f.y + f.h - h - inset();
    return { x, y, w, h };
  };
  const order = [...CORNERS].map((c) => [r(), c] as const).sort((a, b) => a[0] - b[0]).map(([, c]) => c);
  const clear = (rc: Rect) => !hb || !hit(rc, hb);
  const lc = order.find((c) => clear(at(c, lw, lh))) ?? "bl";
  const lr = at(lc, lw, lh);
  const mc = order.find((c) => c !== lc && clear(at(c, d, d)) && !hit(at(c, d, d), lr)) ?? order.find((c) => c !== lc)!;
  const mr = at(mc, d, d);
  markEl.cx = mr.x + d / 2;
  markEl.cy = mr.y + d / 2;
  const lockupEl = { ...lockup(lr.x, lr.y, lk), box: r.chance(0.5) };
  return { lockupEl };
}

function outlined(e: Element): Element {
  if (e.kind === "flower") return { ...e, style: "scallop", petals: Math.max(12, e.petals + 4), r: e.r * 1.15 };
  if (e.kind === "headline") return { ...e, box: false };
  return e;
}
