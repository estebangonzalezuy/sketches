import type { CardPose, RigParams, Vec3, View } from "./types";

/** CSS-like perspective distance in world units. */
export const PERSPECTIVE = 1100;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const lerp3 = (a: Vec3, b: Vec3, p: number): Vec3 => ({
  x: lerp(a.x, b.x, p),
  y: lerp(a.y, b.y, p),
  z: lerp(a.z, b.z, p),
});
export const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

export function rotateY(v: Vec3, deg: number): Vec3 {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

/** n points spread evenly over a unit sphere; `slice` limits the band (1 = pole to pole). */
export function fibonacciSphere(n: number, slice: number): Vec3[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = slice * (1 - (2 * (i + 0.5)) / n);
    const r = Math.sqrt(1 - y * y);
    return { x: Math.cos(i * golden) * r, y, z: Math.sin(i * golden) * r };
  });
}

/** Card i's own 0–1 progress: each card starts `delay` later than the one before. */
export function stagger(t: number, i: number, n: number, delay: number): number {
  const span = Math.max(0.05, 1 - (n - 1) * delay);
  return clamp01((t - i * delay) / span);
}

/** Center of the orb in world space. */
export const orbCenter = (p: RigParams): Vec3 => ({ x: p.mainX, y: 0, z: p.mainZ + p.orbZ });

/** Unit-sphere point → world: squash, size, rotate, move to the orb center. */
export function toOrb(u: Vec3, p: RigParams, squash: Vec3, rot: number): Vec3 {
  const v = rotateY({ x: u.x * p.orbSize * squash.x, y: u.y * p.orbSize * squash.y, z: u.z * p.orbSize * squash.z }, rot);
  const c = orbCenter(p);
  return { x: v.x + c.x, y: v.y + c.y, z: v.z + c.z };
}

/** Every card's pose at master ratio t. Card 0 sits on top of the stack. */
export function cardPoses(p: RigParams, squash: Vec3, t: number, spinDeg: number): CardPose[] {
  const pts = fibonacciSphere(p.cards, p.slice);
  const rot = p.mainRotate + spinDeg;
  return pts.map((u, i) => {
    const e = easeInOut(stagger(t, i, p.cards, p.orbDelay));
    const start = { x: p.mainX, y: 0 - i * 5, z: p.mainZ - i * 16 };
    const anchor = toOrb(u, p, squash, rot);
    return { pos: lerp3(start, anchor, e), start, anchor, scale: lerp(1, p.orbCardScale, e), p: e };
  });
}

/** World → screen pixels, with the same falloff as CSS perspective. */
export function project(v: Vec3, view: View): { x: number; y: number; f: number } {
  const f = PERSPECTIVE / (PERSPECTIVE - Math.min(v.z, PERSPECTIVE - 60));
  return { x: view.cx + v.x * f * view.k, y: view.cy + v.y * f * view.k, f: f * view.k };
}

/** Dotted wireframe for the debug sphere: latitude and longitude rings in world space. */
export function sphereRings(p: RigParams, squash: Vec3, spinDeg: number, segments = 48): Vec3[][] {
  const rot = p.mainRotate + spinDeg;
  const rings: Vec3[][] = [];
  for (const lat of [-60, -30, 0, 30, 60]) {
    const y = Math.sin((lat * Math.PI) / 180);
    const r = Math.cos((lat * Math.PI) / 180);
    rings.push(
      Array.from({ length: segments + 1 }, (_, i) => {
        const a = (i / segments) * Math.PI * 2;
        return toOrb({ x: Math.cos(a) * r, y, z: Math.sin(a) * r }, p, squash, rot);
      }),
    );
  }
  for (let j = 0; j < 6; j++) {
    const lon = (j / 6) * Math.PI;
    rings.push(
      Array.from({ length: segments + 1 }, (_, i) => {
        const a = (i / segments) * Math.PI * 2;
        return toOrb({ x: Math.cos(lon) * Math.cos(a), y: Math.sin(a), z: Math.sin(lon) * Math.cos(a) }, p, squash, rot);
      }),
    );
  }
  return rings;
}
