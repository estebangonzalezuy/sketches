import { describe, expect, it } from "vitest";
import { addKey, evalCurve, moveKey, removeKey, sanitizeKeys } from "./curve";
import { cardPoses, fibonacciSphere, stagger } from "./rig";
import type { RigParams } from "./types";

const params: RigParams = {
  cards: 6, orbDelay: 0.05, mainRotate: 30, mainX: 0, mainZ: 0,
  orbSize: 200, orbZ: -100, orbCardScale: 0.7, slice: 0.9,
};
const one = { x: 1, y: 1, z: 1 };

describe("curves", () => {
  const keys = [{ t: 0, v: 2 }, { t: 0.5, v: 0.5 }, { t: 1, v: 1 }];

  it("passes through every key", () => {
    for (const k of keys) expect(evalCurve(keys, k.t)).toBeCloseTo(k.v);
  });

  it("never overshoots between keys", () => {
    for (let i = 0; i <= 100; i++) {
      const v = evalCurve(keys, i / 100);
      expect(v).toBeGreaterThanOrEqual(0.5 - 1e-9);
      expect(v).toBeLessThanOrEqual(2 + 1e-9);
    }
  });

  it("pins endpoints and keeps inner keys in order", () => {
    expect(moveKey(keys, 0, 0.4, 9, 0, 3)[0]).toEqual({ t: 0, v: 3 });
    expect(moveKey(keys, 1, 2, 1, 0, 3)[1].t).toBeLessThan(1);
  });

  it("adds in order and never removes endpoints", () => {
    const { keys: added, index } = addKey(keys, 0.75, 1.5);
    expect(index).toBe(2);
    expect(added.map((k) => k.t)).toEqual([0, 0.5, 0.75, 1]);
    expect(removeKey(keys, 0)).toBe(keys);
    expect(removeKey(keys, 1)).toHaveLength(2);
  });

  it("sanitizes stored keys", () => {
    expect(sanitizeKeys("x", keys, 0, 3)).toBe(keys);
    expect(sanitizeKeys([{ t: 0.9, v: 5 }, { t: 0.1, v: 1 }], keys, 0, 3)).toEqual([
      { t: 0, v: 1 }, { t: 1, v: 3 },
    ]);
  });
});

describe("rig", () => {
  it("puts sphere points on the unit sphere", () => {
    for (const p of fibonacciSphere(20, 1)) expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(1);
  });

  it("staggers cards inside 0–1", () => {
    expect(stagger(0, 3, 6, 0.05)).toBe(0);
    expect(stagger(1, 0, 6, 0.05)).toBe(1);
    expect(stagger(0.5, 5, 6, 0.05)).toBeLessThan(stagger(0.5, 0, 6, 0.05));
  });

  it("starts on the stack and lands on the anchors", () => {
    for (const c of cardPoses(params, one, 0, 0)) expect(c.pos).toEqual(c.start);
    for (const c of cardPoses(params, one, 1, 0)) {
      expect(c.pos.x).toBeCloseTo(c.anchor.x);
      expect(c.pos.z).toBeCloseTo(c.anchor.z);
      expect(c.scale).toBeCloseTo(0.7);
    }
  });
});
