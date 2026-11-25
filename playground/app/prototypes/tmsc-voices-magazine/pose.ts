/**
 * Pure math for one sheet's turn. No three.js, no DOM: the shader receives these numbers.
 *
 * A sheet is held by its free edge. `p` is where that edge is (0 right stack … 1 left stack,
 * as an angle 0…π around the spine). The part near the spine lags behind the edge by the bend
 * angle, and the rest wraps around a cylinder, so the edge never passes π and the sheet never
 * dips below the stack it leaves or lands on.
 */

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const ease = {
  inOut: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x: number) => 1 - Math.pow(1 - x, 3),
  /** Slow lift, quick middle, soft landing: a hand turning a page. */
  turn: (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
};

export type ShaderPose = { root: number; bend: number };

/** Spine angle and wrap angle for edge progress p. Bend fades to 0 at both stacks. */
export function shaderPose(p: number, sign: 1 | -1, bendAmount: number): ShaderPose {
  const pc = clamp(p);
  const edge = Math.PI * pc;
  const bend = bendAmount * Math.pow(Math.sin(Math.PI * pc), 0.6);
  const root = clamp(edge - sign * bend, 0, Math.PI);
  return { root, bend };
}

/** Resting height of sheet k: unturned sheets stack on the right (cover on top), turned ones on the left. */
export function stackHeight(k: number, p: number, count: number, gap: number): number {
  const right = (count - k) * gap;
  const left = (k + 1) * gap;
  return right + (left - right) * smoothstep(0.3, 0.7, p);
}

/**
 * Sideways shift of the whole magazine so a closed magazine sits centered: cover alone at
 * −W/2, open spreads at 0, back cover alone at +W/2. `turned` is the sum of all sheets' p.
 */
export function magazineShift(turned: number, count: number, pageW: number): number {
  return (pageW / 2) * (clamp(turned) - 1 + clamp(turned - (count - 1)));
}

/**
 * Edge progress while dragging. The grab point maps to the page edge: dragging it across to
 * its mirror position turns the page all the way. `grabX` is the pointer's x when it grabbed
 * (positive on the right page), `x` the pointer now.
 */
export function dragProgress(x: number, grabX: number, pageW: number): number {
  const g = Math.max(Math.abs(grabX), pageW * 0.3);
  // acos(x/g) is 0 at +g (right stack) and π at −g (left stack), for either direction
  return Math.acos(clamp(x / g, -1, 1)) / Math.PI;
}

/** Fold angle from where the page is held: bottom corner tilts one way, top corner the other. */
export function foldAngle(grabV: number, nowV: number, pageH: number): number {
  const v = clamp(grabV / (pageH / 2), -1, 1);
  const corner = Math.sign(v) * smoothstep(0.25, 1, Math.abs(v)) * 0.34;
  return clamp(corner + ((nowV - grabV) / pageH) * 0.5, -0.4, 0.4);
}
