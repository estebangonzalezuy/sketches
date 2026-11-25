import { describe, expect, it } from "vitest";
import { BLOCK_TYPE_CONTRAST, contrast, FIGURES, MONO_COLORS, monoPalette, MOTIF_CONTRAST, PALETTE_BLOCK_TYPE_CONTRAST, paletteFor, PAPERS } from "./palettes";
import type { Palette } from "./types";

const BLOCKS = ["blue", "pink", "lilac", "mint", "orange", "yellow", "green"] as const;

function readable(p: Palette, paper: string, blockType: number) {
  expect(p.paper).toBe(paper);
  expect(contrast(p.paper, p.ink)).toBeGreaterThanOrEqual(4.5);
  for (const k of BLOCKS) {
    expect(contrast(p[k], p.ink)).toBeGreaterThanOrEqual(blockType);
    expect(contrast(p[k], p.paper)).toBeGreaterThanOrEqual(MOTIF_CONTRAST);
  }
}

describe("palettes", () => {
  it("are readable on every background", () => {
    expect(FIGURES.length).toBeGreaterThanOrEqual(2);
    for (const [name, hex] of Object.entries(PAPERS)) for (const f of FIGURES) readable(paletteFor(f, name, "off"), hex, PALETTE_BLOCK_TYPE_CONTRAST);
  });
  it("include Verde blocks", () => expect(Object.values(paletteFor("Ink", "Blanco", "off"))).toContain("#2E7D46"));
  it("fall back to white and Ink for unknown names", () => {
    const p = paletteFor("Blanco / Ink", "nope", "off");
    expect([p.paper, p.ink]).toEqual(["#FFFFFF", "#0C0C0C"]);
  });
});

describe("mono", () => {
  it("keeps every colour readable on every background", () => {
    for (const [name, hex] of Object.entries(PAPERS)) for (const n of MONO_COLORS) readable(paletteFor("Ink", name, n), hex, BLOCK_TYPE_CONTRAST);
  });
  it("uses the colour itself for type when it is already deep", () => expect(monoPalette("Ink").ink).toBe("#0C0C0C"));
  it("gives every colour at least two block tones", () =>
    MONO_COLORS.forEach((n) => {
      const p = monoPalette(n);
      expect(new Set([p.blue, p.pink, p.lilac, p.mint]).size).toBeGreaterThanOrEqual(2);
    }));
});
