import { bands, fitSize, flower, headline, spiral, type Measure } from "./elements";
import { mosaic, type Box } from "./mosaic";
import type { Rng } from "./random";
import type { Element, Swatch, Template } from "./types";

export interface Frame extends Box {
  W: number;
  H: number;
  m: number;
}

type Layout = (f: Frame, r: Rng, density: number, measure: Measure) => Element[];

const trio = (r: Rng): Swatch[][] => r.pick([[["blue"], ["lilac"], ["mint"]], [["pink"], ["blue"], ["yellow"]], [["mint"], ["pink"], ["lilac"]]]) as Swatch[][];

const head = (f: Frame, m: Measure, text: string, x: number, y: number, w: number, h: number, o = {}) =>
  headline(x, y, fitSize(m, text, w, h), text, o);

export const LAYOUTS: Record<Template, Layout> = {
  // tall stacked headline top-right, a twisting spiral over nested frames
  stack: (f, r, d, m) => {
    const { W, H, m: mm } = f;
    return [
      ...mosaic(r, { x: f.x, y: f.y, w: f.w, h: f.h * 0.12 }, 4, 2, d * 0.6),
      ...mosaic(r, { x: f.x, y: f.y + f.h * 0.86, w: f.w, h: f.h * 0.14 }, 5, 2, d * 0.5),
      bands(f.x + f.w * 0.07, f.y + f.h * 0.14, f.w * 0.86, f.h * 0.7, W * 0.03, ["blue", "cream", "blue", "mint"]),
      spiral(W * 0.5, H * 0.53, W * 0.34, ["cream", "blue", "pink", "mint", "lilac", "yellow", "orange", "green"]),
      head(f, m, "Motion,\nNow", W - mm - W * 0.4, f.y + f.h * 0.02, W * 0.38, H * 0.22),
    ];
  },
  // two-line headline top-left, three flowers cascading over a mosaic
  cascade: (f, r, d, m) => {
    const { W, H } = f;
    const [a, b, c] = trio(r);
    return [
      ...mosaic(r, { x: f.x, y: f.y + f.h * 0.16, w: f.w, h: f.h * 0.66 }, 6, 8, d),
      flower(W * 0.28, H * 0.4, W * 0.19, a, { petals: 10 }),
      flower(W * 0.5, H * 0.54, W * 0.19, b, { petals: 10 }),
      flower(W * 0.71, H * 0.68, W * 0.19, c, { petals: 10 }),
      head(f, m, "Motion,\nNow", f.x + W * 0.015, f.y + f.h * 0.02, W * 0.56, H * 0.2),
    ];
  },
  // one line across the top, two big overlapping flowers
  overlap: (f, r, d, m) => {
    const { W, H } = f;
    return [
      ...mosaic(r, { x: f.x, y: f.y, w: f.w, h: f.h * 0.16 }, 2, 1, 1),
      ...mosaic(r, { x: f.x, y: f.y + f.h * 0.16, w: f.w, h: f.h * 0.68 }, 6, 7, d),
      flower(W * 0.36, H * 0.43, W * 0.3, ["blue", "pink", "orange", "pink"], { petals: 8, disc: "lilac" }),
      flower(W * 0.63, H * 0.58, W * 0.24, ["mint", "cream"], { petals: 8, disc: "mint" }),
      head(f, m, "Motion, Now", f.x + W * 0.015, f.y + f.h * 0.02, f.w - W * 0.03, H * 0.13, { box: false }),
    ];
  },
  // vertical headline down the left edge, one big flower
  vertical: (f, r, d, m) => {
    const { W, H } = f;
    const col = W * 0.2;
    return [
      ...mosaic(r, { x: f.x + col, y: f.y, w: f.w - col, h: f.h * 0.85 }, 5, 8, d),
      flower(W * 0.6, H * 0.5, W * 0.32, ["lilac", "mint"], { petals: 8, disc: "yellow" }),
      headline(f.x + W * 0.012, f.y + f.h * 0.015, fitSize(m, "Motion, Now", col - W * 0.02, f.h * 0.8, true), "Motion, Now", { vertical: true, box: false }),
    ];
  },
  // line art: one scalloped flower over the grid, headline stepping down
  line: (f, _r, _d, m) => {
    const { W, H } = f;
    return [
      flower(W * 0.5, H * 0.52, W * 0.4, ["cream"], { style: "scallop", petals: 14 }),
      head(f, m, "Motion,", f.x + W * 0.04, f.y + f.h * 0.06, W * 0.48, H * 0.14),
      head(f, m, "Now", f.x + W * 0.52, f.y + f.h * 0.15, W * 0.3, H * 0.13),
    ];
  },
};
