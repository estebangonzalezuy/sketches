/** Particle state and one simulation step. Pure: no React, no canvas. */
import { MAX_AGE } from "./data";
import type { Particles, Settings, Size } from "./types";

type Noise = (x: number, y: number, z: number) => number;

export function createParticles(count: number, size: Size, rng: () => number): Particles {
  const p: Particles = {
    count,
    x: new Float32Array(count),
    y: new Float32Array(count),
    px: new Float32Array(count),
    py: new Float32Array(count),
    age: new Uint16Array(count),
  };
  for (let i = 0; i < count; i++) respawn(p, i, size, rng, Math.floor(rng() * MAX_AGE));
  return p;
}

function respawn(p: Particles, i: number, size: Size, rng: () => number, age = 0) {
  p.x[i] = p.px[i] = rng() * size.width;
  p.y[i] = p.py[i] = rng() * size.height;
  p.age[i] = age;
}

/** Field angle at a point. `scale` is how many noise cells span the shorter side. */
export function fieldAngle(noise: Noise, x: number, y: number, t: number, scale: number, size: Size) {
  const k = scale / Math.min(size.width, size.height);
  return noise(x * k, y * k, t) * Math.PI * 2;
}

/**
 * Moves every particle along the field. `time` advances by `drift` per second of
 * simulation so the field slowly changes shape.
 */
export function step(
  p: Particles,
  noise: Noise,
  settings: Pick<Settings, "speed" | "scale">,
  time: number,
  size: Size,
  rng: () => number,
) {
  const speed = settings.speed * (Math.min(size.width, size.height) / 400);
  for (let i = 0; i < p.count; i++) {
    p.px[i] = p.x[i];
    p.py[i] = p.y[i];
    const a = fieldAngle(noise, p.x[i], p.y[i], time, settings.scale, size);
    p.x[i] += Math.cos(a) * speed;
    p.y[i] += Math.sin(a) * speed;
    p.age[i]++;
    const out = p.x[i] < 0 || p.x[i] > size.width || p.y[i] < 0 || p.y[i] > size.height;
    if (out || p.age[i] > MAX_AGE) respawn(p, i, size, rng);
  }
}
