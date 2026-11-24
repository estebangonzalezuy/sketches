/** Dot motion: each dot springs from where it was to its cluster slot, then drifts. Pure. */
import { spring } from "@/lib/tmsc/ease";
import { wobble } from "@/lib/tmsc/random";
import { MOVE_DUR, STAGGER } from "./data";

const ease = spring(0.28);

export class Dots {
  readonly n: number;
  x: Float32Array;
  y: Float32Array;
  private fx: Float32Array;
  private fy: Float32Array;
  private tx: Float32Array;
  private ty: Float32Array;
  private start: Float32Array;

  constructor(n: number, w: number, h: number) {
    this.n = n;
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      // start as a loose cloud in the middle
      const r = Math.sqrt((i + 0.5) / n) * Math.min(w, h) * 0.32;
      this.x[i] = w / 2 + Math.cos(i * 2.39996) * r * 1.3;
      this.y[i] = h * 0.6 + Math.sin(i * 2.39996) * r * 0.8;
    }
    this.fx = this.x.slice();
    this.fy = this.y.slice();
    this.tx = this.x.slice();
    this.ty = this.y.slice();
    this.start = new Float32Array(n);
  }

  /** Send every dot to new targets, 1ms apart, left to right. */
  retarget(tx: Float32Array, ty: Float32Array, now: number, instant: boolean) {
    const order = Array.from({ length: this.n }, (_, i) => i).sort((a, b) => tx[a] - tx[b]);
    order.forEach((i, k) => {
      this.fx[i] = this.x[i];
      this.fy[i] = this.y[i];
      this.start[i] = instant ? -1e9 : now + k * STAGGER;
    });
    this.tx = tx;
    this.ty = ty;
  }

  /** Base positions at `now` (seconds); drift is added when drawing. */
  update(now: number) {
    for (let i = 0; i < this.n; i++) {
      const p = ease((now - this.start[i]) / MOVE_DUR);
      this.x[i] = this.fx[i] + (this.tx[i] - this.fx[i]) * p;
      this.y[i] = this.fy[i] + (this.ty[i] - this.fy[i]) * p;
    }
  }
}

/** Drift offset for dot i: a slow, smooth wander. */
export function drift(i: number, now: number, amount: number): [number, number] {
  return [wobble(i * 0.37, now * 0.55) * amount, wobble(i * 0.37 + 9.1, now * 0.48 + 4) * amount];
}
