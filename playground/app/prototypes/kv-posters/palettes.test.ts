import { describe, expect, it } from "vitest";
import { contrast, luminance, MOTIF_CONTRAST, PAIR_PALETTES } from "./palettes";

const pals = Object.values(PAIR_PALETTES);

describe("pair palettes", () => {
  it("keeps only light backgrounds with readable type", () => {
    expect(pals.length).toBeGreaterThan(8);
    for (const p of pals) {
      expect(luminance(p.paper)).toBeGreaterThanOrEqual(0.3);
      expect(contrast(p.paper, p.ink)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("keeps every coloured block apart from the background and the figure", () => {
    for (const p of pals) {
      for (const k of ["blue", "pink", "lilac", "mint", "orange", "yellow", "green", "brown"] as const) {
        expect(p[k]).not.toBe(p.ink);
        expect(contrast(p[k], p.paper)).toBeGreaterThanOrEqual(MOTIF_CONTRAST);
      }
    }
  });
});
