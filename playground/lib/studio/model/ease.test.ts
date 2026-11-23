import { describe, expect, it } from "vitest";
import { BACK, ease, sameEase } from "./ease";

describe("eases", () => {
  it("treats a named ease and its bezier as the same curve", () => {
    expect(sameEase("ease", [0.33, 0, 0.67, 1])).toBe(true);
    expect(sameEase("linear", "ease")).toBe(false);
    expect(sameEase("hold", "hold")).toBe(true);
  });
  it("lets a custom curve overshoot (Back)", () => {
    const peak = Math.max(...Array.from({ length: 50 }, (_, i) => ease(BACK, i / 49)));
    expect(peak).toBeGreaterThan(1);
    expect(ease(BACK, 1)).toBe(1);
  });
});
