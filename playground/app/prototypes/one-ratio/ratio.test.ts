import { describe, expect, it } from "vitest";
import { DEFAULT_TRACKS } from "./data";
import { EASES, remap, sampleAll } from "./ratio";
import { sanitizeTracks } from "./sanitize";

describe("one ratio", () => {
  it("remap clamps outside its window", () => {
    expect(remap(0.1, 0.15, 0.7)).toBe(0);
    expect(remap(0.9, 0.15, 0.7)).toBe(1);
    expect(remap(0.425, 0.15, 0.7)).toBeCloseTo(0.5);
  });

  it("eases hit their ends", () => {
    for (const f of Object.values(EASES)) {
      expect(f(0)).toBeCloseTo(0);
      expect(f(1)).toBeCloseTo(1);
    }
  });

  it("matches the readouts from the reference talk", () => {
    const a = sampleAll(DEFAULT_TRACKS, 0.39);
    expect(a.x).toBeCloseTo(41.0, 0);
    expect(a.y).toBeCloseTo(74.2, 0);
    expect(a.scale).toBeCloseTo(1);
    const b = sampleAll(DEFAULT_TRACKS, 0.87);
    expect(b.x).toBeCloseTo(80);
    expect(b.y).toBeCloseTo(12);
    expect(b.scale).toBeCloseTo(0.91, 2);
    expect(b.opacity).toBeCloseTo(0.52, 2);
  });

  it("sanitizes stored tracks back to the default shape", () => {
    const out = sanitizeTracks([{ id: "x", ease: "bogus", input: { from: 3 }, out: [1, "a"] }], DEFAULT_TRACKS);
    expect(out).toHaveLength(4);
    expect(out[0].ease).toBe("easeInOut");
    expect(out[0].input).toEqual({ kind: "window", from: 1, to: 0.7 });
    expect(out[0].out).toEqual([1, 80]);
    expect(out[1]).toEqual(DEFAULT_TRACKS[1]);
  });
});
