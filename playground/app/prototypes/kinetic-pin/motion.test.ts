import { describe, expect, it } from "vitest";
import { quadsAt, restStack, steepCurve, swing, wordsFor } from "./motion";

const curve = steepCurve(0.8);
const motion = { amplitude: 0.5, loop: 2, curve, phase: 0 };

describe("swing", () => {
  it("rests at 0 and at the loop length, peaks at half", () => {
    expect(swing(0, 2, curve)).toBe(0);
    expect(swing(1, 2, curve)).toBe(1);
    expect(swing(2, 2, curve)).toBeCloseTo(0);
  });
  it("holds near the extremes and snaps through the middle", () => {
    expect(swing(0.2, 2, curve)).toBeLessThan(0.05);
    expect(swing(0.8, 2, curve)).toBeGreaterThan(0.95);
  });
});

describe("stack", () => {
  const stack = restStack({ w: 1000, h: 1000 }, [0.4, 0.4], 0.1);
  it("fits and centres the words with no gap", () => {
    expect(stack.x1 - stack.x0).toBeCloseTo(800);
    expect(stack.ys).toHaveLength(3);
    expect(stack.ys[1] - stack.ys[0]).toBeCloseTo(320);
  });
  it("is the rest rectangle at t = 0", () => {
    const [top] = quadsAt(stack, 0, motion);
    expect(top[2][1]).toBeCloseTo(stack.ys[1]);
    expect(top[3][1]).toBeCloseTo(stack.ys[1]);
  });
  it("shares the middle edge and moves L down, R up, outer edges fixed", () => {
    const [top, bottom] = quadsAt(stack, 1, motion);
    expect(top[3]).toEqual(bottom[0]);
    expect(top[2]).toEqual(bottom[1]);
    expect(top[3][1]).toBeGreaterThan(stack.ys[1]);
    expect(top[2][1]).toBeLessThan(stack.ys[1]);
    expect(top[0][1]).toBe(stack.ys[0]);
    expect(bottom[2][1]).toBe(stack.ys[2]);
  });
  it("gives each shared edge its own phase", () => {
    const s3 = restStack({ w: 1000, h: 1000 }, [0.3, 0.3, 0.3], 0.1);
    const q = quadsAt(s3, 1, { ...motion, phase: 0.5 });
    expect(q[0][3][1]).not.toBeCloseTo(q[1][3][1] - (s3.ys[2] - s3.ys[1]));
  });
});

describe("words", () => {
  it("repeats the words to fill N", () => {
    expect(wordsFor("hard work", 3)).toEqual(["HARD", "WORK", "HARD"]);
    expect(wordsFor("  ", 2)).toEqual(["HARD", "WORK"]);
  });
});
