import { describe, expect, it } from "vitest";
import { BLOCK_TYPE_CONTRAST, PALETTE_BLOCK_TYPE_CONTRAST, contrast, MONO_COLORS, monoPalette, MOTIF_CONTRAST, PAIR_PALETTES } from "./palettes";
import type { Palette } from "./types";

const BLOCKS = ["blue", "pink", "lilac", "mint", "orange", "yellow", "green"] as const;

function readable(p: Palette, blockType = BLOCK_TYPE_CONTRAST) {
  expect(p.paper).toBe("#FFFFFF");
  expect(contrast(p.paper, p.ink)).toBeGreaterThanOrEqual(4.5);
  for (const k of BLOCKS) {
    expect(contrast(p[k], p.ink)).toBeGreaterThanOrEqual(blockType);
    expect(contrast(p[k], p.paper)).toBeGreaterThanOrEqual(MOTIF_CONTRAST);
  }
}

describe("white canvas palettes", () => {
  it("are white, with readable type and blocks", () => {
    expect(Object.keys(PAIR_PALETTES).length).toBeGreaterThanOrEqual(2);
    Object.values(PAIR_PALETTES).forEach((p) => readable(p, PALETTE_BLOCK_TYPE_CONTRAST));
  });
  it("include Verde blocks", () => {
    expect(Object.values(PAIR_PALETTES).some((p) => Object.values(p).includes("#2E7D46"))).toBe(true);
  });
});

describe("mono", () => {
  it("keeps every colour readable on white", () => MONO_COLORS.forEach((n) => readable(monoPalette(n))));
  it("uses the colour itself for type when it is already deep", () => expect(monoPalette("Ink").ink).toBe("#0C0C0C"));
  it("gives every colour at least two block tones", () =>
    MONO_COLORS.forEach((n) => {
      const p = monoPalette(n);
      expect(new Set([p.blue, p.pink, p.lilac, p.mint]).size).toBeGreaterThanOrEqual(2);
    }));
});
