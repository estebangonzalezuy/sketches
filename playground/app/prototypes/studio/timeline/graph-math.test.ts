import { describe, expect, it } from "vitest";
import { dragHandle, handles, segments } from "./graph-math";
import type { Key } from "../model/types";

const keys: Key[] = [
  { id: "a", t: 0, v: 0, ease: "linear" },
  { id: "b", t: 2, v: 100, ease: "linear" },
];

describe("graph math", () => {
  it("places linear handles on the straight line", () => {
    const [s] = segments(keys).segs;
    const [p1, p2] = handles(s)!;
    expect(p1).toEqual([0, 0]);
    expect(p2[0]).toBeCloseTo(2);
    expect(p2[1]).toBeCloseTo(100);
  });
  it("turns a handle drag into a custom bezier", () => {
    const [s] = segments(keys).segs;
    expect(dragHandle(s, 0, 1, 0)).toEqual([0.5, 0, 1, 1]);
  });
  it("plots non-numbers as progress", () => {
    const r = segments([{ id: "a", t: 0, v: [0, 0], ease: "ease" }, { id: "b", t: 1, v: [5, 5], ease: "ease" }]);
    expect(r.numeric).toBe(false);
    expect([r.segs[0].va, r.segs[0].vb]).toEqual([0, 1]);
  });
});
