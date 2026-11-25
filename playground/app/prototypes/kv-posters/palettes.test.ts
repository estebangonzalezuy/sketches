import { describe, expect, it } from "vitest";
import { PAIR_PALETTES } from "./palettes";

describe("pair palettes", () => {
  it("has every pair from the sheet", () => expect(Object.keys(PAIR_PALETTES)).toHaveLength(31));
  it("keeps motif colours apart from the background and the figure", () => {
    for (const p of Object.values(PAIR_PALETTES)) {
      for (const k of ["blue", "pink", "lilac", "mint", "orange", "yellow"] as const) {
        expect(p[k]).not.toBe(p.paper);
        expect(p[k]).not.toBe(p.ink);
      }
      expect(p.brown).not.toBe(p.paper);
      expect(p.green).not.toBe(p.paper);
    }
  });
});
