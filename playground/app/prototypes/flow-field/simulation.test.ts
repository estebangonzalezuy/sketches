import { describe, expect, it } from "vitest";
import { createNoise, createRng } from "./noise";
import { createParticles, step } from "./simulation";

const size = { width: 300, height: 200 };

describe("flow field simulation", () => {
  it("is deterministic for a seed", () => {
    const a = createNoise(7);
    const b = createNoise(7);
    expect(a(1.3, 2.7, 0.5)).toBe(b(1.3, 2.7, 0.5));
  });

  it("keeps noise roughly in [-1, 1]", () => {
    const n = createNoise(1);
    for (let i = 0; i < 500; i++) {
      const v = n(i * 0.37, i * 0.11, i * 0.05);
      expect(Math.abs(v)).toBeLessThanOrEqual(1.1);
    }
  });

  it("keeps every particle inside the canvas", () => {
    const rng = createRng(3);
    const noise = createNoise(3);
    const p = createParticles(200, size, rng);
    for (let t = 0; t < 300; t++) step(p, noise, { speed: 4, scale: 3 }, t / 60, size, rng);
    for (let i = 0; i < p.count; i++) {
      expect(p.x[i]).toBeGreaterThanOrEqual(0);
      expect(p.x[i]).toBeLessThanOrEqual(size.width);
      expect(p.y[i]).toBeGreaterThanOrEqual(0);
      expect(p.y[i]).toBeLessThanOrEqual(size.height);
    }
  });
});
