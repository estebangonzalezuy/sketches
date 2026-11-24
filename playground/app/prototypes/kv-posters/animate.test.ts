import { describe, expect, it } from "vitest";
import { animate, buildAt } from "./animate";
import { generate } from "./generate";

const poster = generate({ template: "cascade", seed: 3, format: "3x4", density: 0.5, paint: "fills" });
const base = { duration: 6, stagger: 0.5, turns: 1 };

describe("animate", () => {
  it("starts empty and ends at rest when building", () => {
    const a = animate(poster, 0, { ...base, style: "build" });
    const z = animate(poster, 6, { ...base, style: "build" });
    expect([...a.els.values()].every((s) => s.p === 0)).toBe(true);
    expect([...z.els.values()].every((s) => s.p === 1 && s.spin === 0)).toBe(true);
  });

  it("applies the timing curve to each build", () => {
    const lin = animate(poster, 1.2, { ...base, style: "build", ease: "linear" });
    const out = animate(poster, 1.2, { ...base, style: "build", ease: [0, 0, 0.2, 1] });
    const id = poster.elements[0].id;
    expect(out.els.get(id)!.p).toBeGreaterThan(lin.els.get(id)!.p);
    expect(animate(poster, 6, { ...base, style: "build", ease: "hold" }).els.get(id)!.p).toBe(1);
  });

  it("in + out returns to empty, so the loop closes", () => {
    expect(buildAt("in + out", 0)).toBe(0);
    expect(buildAt("in + out", 0.6)).toBe(1);
    expect(buildAt("in + out", 1)).toBe(0);
  });

  it("loop spins by whole symmetry periods over the length", () => {
    const z = animate(poster, 6, { ...base, style: "loop", turns: 2 });
    const f = poster.elements.find((e) => e.kind === "flower")!;
    if (f.kind !== "flower") throw new Error();
    expect(z.els.get(f.id)!.spin).toBeCloseTo(((Math.PI * 2) / f.petals) * 2);
  });
});
