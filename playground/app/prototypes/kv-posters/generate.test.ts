import { describe, expect, it } from "vitest";
import { generate, resolveTemplate } from "./generate";

describe("generate", () => {
  it("is deterministic per seed", () => {
    const o = { template: "auto" as const, seed: 42, format: "3x4" as const, density: 0.5, paint: "fills" as const };
    const strip = (p: ReturnType<typeof generate>) => JSON.stringify(p.elements.map((e) => ({ ...e, id: "" })));
    expect(strip(generate(o))).toEqual(strip(generate(o)));
  });

  it("builds every layout inside the frame with a headline, lockup and mark", () => {
    for (const template of ["stack", "cascade", "overlap", "vertical", "line"] as const) {
      const p = generate({ template, seed: 7, format: "4x5", density: 0.6, paint: "squares" });
      const kinds = p.elements.map((e) => e.kind);
      expect(kinds).toContain("headline");
      expect(kinds).toContain("lockup");
      expect(kinds).toContain("mark");
      for (const e of p.elements) {
        if ("x" in e) expect(e.x).toBeGreaterThanOrEqual(0);
        if ("x" in e) expect(e.x).toBeLessThan(p.width);
      }
    }
  });

  it("auto picks a layout from the seed", () => {
    const seen = new Set(Array.from({ length: 40 }, (_, s) => resolveTemplate({ template: "auto", seed: s, format: "3x4", density: 0, paint: "fills" })));
    expect(seen.size).toBeGreaterThan(2);
  });
});

describe("lockup", () => {
  it("varies its box and corner across seeds", () => {
    const boxes = new Set<boolean>();
    const corners = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const p = generate({ template: "auto", seed, format: "3x4", density: 0.55, paint: "fills" });
      const l = p.elements.find((e) => e.kind === "lockup")!;
      boxes.add(l.kind === "lockup" && l.box);
      corners.add(`${l.y < p.height / 2 ? "t" : "b"}${l.x < p.width / 2 ? "l" : "r"}`);
    }
    expect(boxes.size).toBe(2);
    expect(corners.size).toBeGreaterThanOrEqual(3);
  });
});
