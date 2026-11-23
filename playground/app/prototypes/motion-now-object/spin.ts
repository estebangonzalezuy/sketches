/** Turntable with inertia: drag to spin, then it eases back to the base speed. No DOM. */
import { approach } from "@/lib/tmsc/ease";
import { LOOP } from "./data";

export class Spin {
  theta = 0;
  orbit = 0;
  private vel = 0;
  private drag: { x: number; t: number } | null = null;

  /** Base angular speed for `speed` turns per loop, rad/s. */
  static base(speed: number): number {
    return (speed * Math.PI * 2) / LOOP;
  }

  down(x: number, now: number) {
    this.drag = { x, t: now };
    this.vel = 0;
  }

  move(x: number, now: number, unit: number) {
    if (!this.drag) return;
    const d = (x - this.drag.x) / unit;
    const dt = Math.max(1 / 240, now - this.drag.t);
    this.theta += d;
    this.vel = this.vel * 0.4 + (d / dt) * 0.6;
    this.drag = { x, t: now };
  }

  up() {
    this.drag = null;
  }

  get dragging() {
    return this.drag !== null;
  }

  tick(dt: number, speed: number, reduced: boolean) {
    const base = reduced ? 0 : Spin.base(speed);
    if (!this.drag) {
      this.vel = approach(this.vel, base, dt, 1.1);
      this.theta += this.vel * dt;
    }
    this.orbit += (reduced ? 0 : Math.max(0.15, speed) * 0.5 * Math.PI * 2 / LOOP) * dt;
  }
}

/** The exported loop: whole turns of the medal and one orbit turn in LOOP seconds, so it repeats seamlessly. */
export function loopAt(t: number, speed: number): { theta: number; orbit: number } {
  const turns = Math.max(1, Math.round(speed));
  return { theta: (t / LOOP) * turns * Math.PI * 2, orbit: (t / LOOP) * Math.PI * 2 };
}
