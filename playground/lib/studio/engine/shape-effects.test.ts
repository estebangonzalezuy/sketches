import { describe, expect, it } from "vitest";
import { bboxOf, invert3, project, squareToQuad, type Pt, type ShapePath } from "./geometry";
import { pixelShape, spansAt } from "./pixel-shape";
import { cornerPin, radialWarp } from "./shape-effects";
import { letters } from "./letters";

const square = (x: number, y: number, s: number): ShapePath => ({ fill: "#000", contours: [[[x, y], [x + s, y], [x + s, y + s], [x, y + s]]] });

describe("homography", () => {
  it("maps the unit square to the quad, and back", () => {
    const quad: [Pt, Pt, Pt, Pt] = [[10, 20], [200, 0], [220, 180], [0, 150]];
    const m = squareToQuad(quad);
    const corners: Pt[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    corners.forEach(([u, v], i) => {
      const [x, y] = project(m, u, v);
      expect(x).toBeCloseTo(quad[i][0]);
      expect(y).toBeCloseTo(quad[i][1]);
    });
    const [u, v] = project(invert3(m), 220, 180);
    expect(u).toBeCloseTo(1);
    expect(v).toBeCloseTo(1);
  });
});

describe("corner pin", () => {
  it("is the identity with pins on the box corners", () => {
    const out = cornerPin([square(0, 0, 100)], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    expect(bboxOf(out)).toEqual({ x: 0, y: 0, w: 100, h: 100 });
  });
  it("moves the box to the pins", () => {
    const out = cornerPin([square(0, 0, 100)], [[0, 0], [2, 0], [2, 1], [0, 1]]);
    expect(bboxOf(out).w).toBeCloseTo(200);
  });
});

describe("pixel shape", () => {
  it("finds the inside of a square", () => {
    expect(spansAt(square(0, 0, 10).contours, 5)).toEqual([[0, 10]]);
  });
  it("covers a square with one merged run per row", () => {
    const out = pixelShape([square(0, 0, 40)], 10);
    expect(out[0].contours).toHaveLength(4);
    expect(bboxOf(out)).toEqual({ x: 0, y: 0, w: 40, h: 40 });
  });
  it("keeps counters empty (nonzero, opposite winding)", () => {
    const ring: ShapePath = { fill: "#000", contours: [square(0, 0, 30).contours[0], [[10, 10], [10, 20], [20, 20], [20, 10]]] };
    const mid = pixelShape([ring], 10)[0].contours.filter((c) => c[0][1] === 10);
    expect(mid).toHaveLength(2);
  });
  it("keeps cells left of the layer origin (negative indices)", () => {
    const out = pixelShape([square(-100, -20, 200)], 10);
    expect(bboxOf(out)).toEqual({ x: -100, y: -20, w: 200, h: 200 });
  });
  it("passes through below one unit", () => {
    const p = [square(0, 0, 10)];
    expect(pixelShape(p, 0)).toBe(p);
  });
});

describe("radial warp", () => {
  it("is flat at amount 0 and bends at 1", () => {
    const p = [square(0, 0, 100)];
    expect(radialWarp(p, { center: [0, 0], inner: 100, depth: 50, angle: 0, sweep: 90, amount: 0 })).toBe(p);
    const out = radialWarp(p, { center: [0, 0], inner: 100, depth: 50, angle: 0, sweep: 90, amount: 1 });
    const b = bboxOf(out);
    expect(b.x).toBeCloseTo(0, 0);
    expect(b.y).toBeCloseTo(0, 0);
    expect(b.w).toBeCloseTo(150, 0);
  });
});

describe("letters", () => {
  const word = [square(0, 0, 10), square(20, 0, 10), square(40, 0, 10)];
  const base = { mode: "alternate" as const, stretch: 0.5, skew: 0, frequency: 1, phase: 0, pin: "baseline" as const, seed: 1 };
  it("stretches letters by their own swing, keeping the baseline", () => {
    const out = letters(word, base);
    expect(bboxOf([out[0]]).h).toBeCloseTo(5);
    expect(bboxOf([out[1]]).h).toBeCloseTo(15);
    expect(bboxOf([out[0]]).y + bboxOf([out[0]]).h).toBeCloseTo(10);
  });
  it("is the identity with no stretch and no skew", () => {
    const out = letters(word, { ...base, stretch: 0 });
    expect(bboxOf(out)).toEqual(bboxOf(word));
  });
});
