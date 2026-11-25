import { describe, expect, it } from "vitest";
import { BLOCK_TYPE_CONTRAST, contrast, luminance, MOTIF_CONTRAST, PAIR_PALETTES } from "./palettes";

const pals = Object.values(PAIR_PALETTES);

describe("pair palettes", () => {
  it("keeps only light backgrounds with readable type", () => {
    expect(pals.length).toBeGreaterThan(8);
    for (const p of pals) {
      expect(luminance(p.paper)).toBeGreaterThanOrEqual(0.3);
      expect(contrast(p.paper, p.ink)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("keeps every coloured block apart from the background and readable under the type", () => {
    for (const p of pals) {
      for (const k of ["blue", "pink", "lilac", "mint", "orange", "yellow", "green"] as const) {
        expect(contrast(p[k], p.ink)).toBeGreaterThanOrEqual(BLOCK_TYPE_CONTRAST);
        expect(contrast(p[k], p.paper)).toBeGreaterThanOrEqual(MOTIF_CONTRAST);
      }
    }
  });
});
