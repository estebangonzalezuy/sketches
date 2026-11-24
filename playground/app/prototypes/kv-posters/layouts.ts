import { bands, fitSize, flower, headline, spiral, type Measure } from "./elements";
import { mosaic, type Box } from "./mosaic";
import { PASTELS } from "./data";
import { headlineVariant } from "./vary";
import type { Rng } from "./random";
import type { Element, Swatch, Template } from "./types";

export interface Frame extends Box {
  W: number;
  H: number;
  m: number;
  /** size unit for motifs: the width on 3:4 and taller, less on squatter formats */
  U: number;
}

type Layout = (f: Frame, r: Rng, density: number, measure: Measure) => Element[];

const trio = (r: Rng): Swatch[][] => r.pick([[["blue"], ["lilac"], ["mint"]], [["pink"], ["blue"], ["yellow"]], [["mint"], ["pink"], ["lilac"]]]) as Swatch[][];

const head = (f: Frame, m: Measure, text: string, x: number, y: number, w: number, h: number, o = {}) =>
  headline(x, y, fitSize(m, text, w, h), text, o);

export const LAYOUTS: Record<Template, Layout> = {
  // tall stacked headline top-right, a twisting spiral over nested frames
  stack: (f, r, d, m) => {
    const { W, H, U, m: mm } = f;
    return [
      ...mosaic(r, { x: f.x, y: f.y, w: f.w, h: f.h * 0.12 }, 4, 2, d * 0.6),
      ...mosaic(r, { x: f.x, y: f.y + f.h * 0.86, w: f.w, h: f.h * 0.14 }, 5, 2, d * 0.5),
      bands(f.x + f.w * 0.07, f.y + f.h * 0.14, f.w * 0.86, f.h * 0.7, U * 0.03, ["blue", "cream", "blue", "mint"]),
      spiral(W * 0.5, H * 0.53, U * 0.34, ["cream", "blue", "pink", "mint", "lilac", "yellow", "orange", "green"]),
      head(f, m, "Motion,\nNow", W - mm - W * 0.4, f.y + f.h * 0.02, W * 0.38, H * 0.22),
    ];
  },
  // two-line headline top-left, three flowers cascading over a mosaic
  cascade: (f, r, d, m) => {
    const { W, H, U } = f;
    const [a, b, c] = trio(r);
    return [
      ...mosaic(r, { x: f.x, y: f.y + f.h * 0.16, w: f.w, h: f.h * 0.66 }, 6, 8, d),
      flower(W * 0.28, H * 0.4, U * 0.19, a, { petals: 10 }),
      flower(W * 0.5, H * 0.54, U * 0.19, b, { petals: 10 }),
      flower(W * 0.71, H * 0.68, U * 0.19, c, { petals: 10 }),
      head(f, m, "Motion,\nNow", f.x + W * 0.015, f.y + f.h * 0.02, W * 0.56, H * 0.2),
    ];
  },
  // one line across the top, two big overlapping flowers
  overlap: (f, r, d, m) => {
    const { W, H, U } = f;
    return [
      ...mosaic(r, { x: f.x, y: f.y, w: f.w, h: f.h * 0.16 }, 2, 1, 1),
      ...mosaic(r, { x: f.x, y: f.y + f.h * 0.16, w: f.w, h: f.h * 0.68 }, 6, 7, d),
      flower(W * 0.36, H * 0.43, U * 0.3, ["blue", "pink", "orange", "pink"], { petals: 8, disc: "lilac" }),
      flower(W * 0.63, H * 0.58, U * 0.24, ["mint", "cream"], { petals: 8, disc: "mint" }),
      head(f, m, "Motion, Now", f.x + W * 0.015, f.y + f.h * 0.02, f.w - W * 0.03, H * 0.13, { box: false }),
    ];
  },
  // vertical headline down the left edge, one big flower
  vertical: (f, r, d, m) => {
    const { W, H, U } = f;
    const col = W * 0.2;
    return [
      ...mosaic(r, { x: f.x + col, y: f.y, w: f.w - col, h: f.h * 0.85 }, 5, 8, d),
      flower(W * 0.6, H * 0.5, U * 0.32, ["lilac", "mint"], { petals: 8, disc: "yellow" }),
      headline(f.x + W * 0.012, f.y + f.h * 0.015, fitSize(m, "Motion, Now", col - W * 0.02, f.h * 0.8, true), "Motion, Now", { vertical: true, box: false }),
    ];
  },
  // free: one to three motifs anywhere, a mosaic, the headline wherever the seed puts it
  free: (f, r, d, m) => {
    const { U } = f;
    const n = r.int(1, 3);
    const motifs: Element[] = Array.from({ length: n }, () => {
      const rad = U * r.range(0.16, n === 1 ? 0.42 : 0.28);
      const cx = f.x + rad * 0.5 + r() * (f.w - rad);
      const cy = f.y + f.h * 0.2 + r() * f.h * 0.6;
      return r.chance(0.25)
        ? spiral(cx, cy, rad, [r.pick(PASTELS), r.pick(PASTELS), "cream", r.pick(PASTELS)])
        : flower(cx, cy, rad, [r.pick(PASTELS), r.pick(PASTELS)], { petals: r.int(6, 12), disc: r.pick(["cream", "yellow", "lilac", "mint"]) });
    });
    return [
      ...mosaic(r, { x: f.x, y: f.y, w: f.w, h: f.h * r.range(0.7, 0.95) }, r.int(3, 7), r.int(4, 10), d),
      ...motifs,
      headlineVariant(headline(0, 0, 100, "Motion,\nNow"), r, f, m),
    ];
  },
  // line art: one scalloped flower over the grid, headline stepping down
  line: (f, _r, _d, m) => {
    const { W, H, U } = f;
    return [
      flower(W * 0.5, H * 0.52, U * 0.4, ["cream"], { style: "scallop", petals: 14 }),
      head(f, m, "Motion,", f.x + W * 0.04, f.y + f.h * 0.06, W * 0.48, H * 0.14),
      head(f, m, "Now", f.x + W * 0.52, f.y + f.h * 0.15, W * 0.3, H * 0.13),
    ];
  },
};
