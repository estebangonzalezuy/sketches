import { PASTELS } from "./data";
import type { Rng } from "./random";
import { uid } from "./random";
import type { Block, Swatch } from "./types";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Uneven cuts of [0, 1]: a construction grid that isn't a spreadsheet. */
export function cuts(r: Rng, n: number, irregular = 0.6): number[] {
  const ws = Array.from({ length: n }, () => 1 + (r() - 0.5) * irregular);
  const sum = ws.reduce((s, w) => s + w, 0);
  let acc = 0;
  return [0, ...ws.map((w) => (acc += w / sum))];
}

/** Flat pastel cells on a grid inside a region; some cells merge sideways. */
export function mosaic(r: Rng, area: Box, cols: number, rows: number, density: number, extra: Swatch[] = ["green", "brown"]): Block[] {
  const xs = cuts(r, cols);
  const ys = cuts(r, rows);
  const out: Block[] = [];
  const colors: Swatch[] = [...PASTELS, ...PASTELS, ...extra];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (!r.chance(density)) continue;
      const span = i < cols - 1 && r.chance(0.25) ? 2 : 1;
      out.push({
        id: uid("b"),
        kind: "block",
        x: Math.round(area.x + xs[i] * area.w),
        y: Math.round(area.y + ys[j] * area.h),
        w: Math.round((xs[Math.min(cols, i + span)] - xs[i]) * area.w),
        h: Math.round((ys[j + 1] - ys[j]) * area.h),
        fill: r.pick(colors),
      });
      i += span - 1;
    }
  }
  return out;
}

/**
 * "Squares" paint: big flat colour fields covering the frame (some cells left as paper),
 * plus a few small tabs hanging off the frame edges, like the printed references.
 */
export function paintSquares(r: Rng, area: Box, W: number, density: number): Block[] {
  const colors: Swatch[] = ["blue", "pink", "lilac", "mint", "orange", "yellow", "green", "blue", "lilac", "pink"];
  const cols = r.int(2, 3);
  const rows = r.int(4, 6);
  const fields = mosaic(r, area, cols, rows, 0.45 + density * 0.55, []).map((b) => ({ ...b, fill: r.pick(colors) }));
  const tabs: Block[] = [];
  for (let i = 0; i < r.int(2, 4); i++) {
    const left = r.chance(0.5);
    const h = area.h * r.range(0.04, 0.12);
    const w = W * r.range(0.02, 0.06);
    tabs.push({ id: uid("t"), kind: "block", x: left ? area.x - w * 0.6 : area.x + area.w - w * 0.4, y: area.y + r.range(0.1, 0.85) * area.h, w, h, fill: r.pick(["green", "lilac", "blue", "orange"] as Swatch[]) });
  }
  return [...fields, ...tabs];
}
