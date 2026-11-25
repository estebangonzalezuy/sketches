import { BEND_CASCADE, BEND_TURN, HOVER_LIFT, PAGE_H, PAGE_W, SHEET_COUNT } from "./data";
import { clamp, dragProgress, ease, foldAngle } from "./pose";
import type { SheetPose } from "./types";

/**
 * Interactive state of the five sheets. Pure: positions come in as page-plane coordinates
 * (x across, v up the page, spine at x = 0), time comes in as dt. No DOM, no three.js.
 */

type Anim = { from: number; to: number; t: number; dur: number; curve: (x: number) => number };
type Sheet = SheetPose & { anim: Anim | null; hover: number };
type Drag = { sheet: number; grabX: number; grabV: number; startX: number; x: number; v: number; vx: number; moved: boolean };

const TURN_DUR = 0.95;
const CASCADE_STAGGER = 0.12;
const CLICK_SLOP = 0.03; // page widths of movement that still count as a click

export class FlipController {
  sheets: Sheet[] = Array.from({ length: SHEET_COUNT }, () => ({ p: 0, sign: 1, bend: BEND_TURN, phi: 0, anim: null, hover: 0 }));
  /** Sheets turned once every running animation lands. The spread being shown. */
  turned = 0;
  private drag: Drag | null = null;
  private hoverSheet = -1;
  private hoverPhi = 0;
  reduced = false;

  get dragging() {
    return this.drag !== null;
  }

  /** Sum of every sheet's progress: drives the sideways centering of a closed magazine. */
  get progress(): number {
    return this.sheets.reduce((a, s) => a + s.p, 0);
  }

  turn(dir: 1 | -1) {
    if (dir === 1 && this.turned < SHEET_COUNT) this.animate(this.turned++, 1, 0, BEND_TURN);
    if (dir === -1 && this.turned > 0) this.animate(--this.turned, 0, 0, BEND_TURN);
  }

  /** Flip through to spread k, sheets cascading one after another. */
  goTo(k: number) {
    const target = clamp(Math.round(k), 0, SHEET_COUNT);
    let i = 0;
    while (this.turned > target) this.animate(--this.turned, 0, i++ * CASCADE_STAGGER, BEND_CASCADE);
    while (this.turned < target) this.animate(this.turned++, 1, i++ * CASCADE_STAGGER, BEND_CASCADE);
  }

  pointerDown(x: number, v: number) {
    if (Math.abs(v) > PAGE_H / 2 || Math.abs(x) > PAGE_W) return false;
    const sheet = x >= 0 ? this.turned : this.turned - 1;
    if (sheet < 0 || sheet >= SHEET_COUNT || this.sheets[sheet].anim) return false;
    this.drag = { sheet, grabX: x, grabV: v, startX: x, x, v, vx: 0, moved: false };
    this.sheets[sheet].sign = x >= 0 ? 1 : -1;
    this.sheets[sheet].bend = BEND_TURN;
    return true;
  }

  pointerMove(x: number, v: number, dt: number) {
    const d = this.drag;
    if (d) {
      d.vx = dt > 0 ? (x - d.x) / dt : d.vx;
      d.x = x;
      d.v = v;
      if (Math.abs(x - d.startX) > CLICK_SLOP) d.moved = true;
      return;
    }
    // hover: the outer third of either page lifts its corner
    const onRight = x > PAGE_W * 0.62 && x <= PAGE_W && Math.abs(v) <= PAGE_H / 2;
    const onLeft = x < -PAGE_W * 0.62 && x >= -PAGE_W && Math.abs(v) <= PAGE_H / 2;
    this.hoverSheet = onRight ? this.turned : onLeft ? this.turned - 1 : -1;
    if (this.hoverSheet >= SHEET_COUNT) this.hoverSheet = -1;
    this.hoverPhi = foldAngle(v, v, PAGE_H);
  }

  pointerLeave() {
    this.hoverSheet = -1;
  }

  pointerUp() {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    const s = this.sheets[d.sheet];
    const forward = s.sign === 1;
    let commit: boolean;
    if (!d.moved) commit = true; // a click turns the page
    else {
      const fling = forward ? d.vx < -2.2 : d.vx > 2.2;
      const back = forward ? d.vx > 2.2 : d.vx < -2.2;
      commit = fling || (!back && (forward ? s.p > 0.45 : s.p < 0.55));
    }
    const to = commit === forward ? 1 : 0;
    if (commit) this.turned += forward ? 1 : -1;
    const dist = Math.abs(to - s.p);
    s.anim = { from: s.p, to, t: 0, dur: d.moved ? 0.22 + 0.55 * dist : TURN_DUR, curve: d.moved ? ease.out : ease.turn };
  }

  update(dt: number) {
    const k = 1 - Math.exp(-dt * 16);
    this.sheets.forEach((s, i) => {
      const atRest = s.p < 0.5 ? 0 : 1;
      if (this.drag?.sheet === i) {
        const target = dragProgress(this.drag.x, this.drag.grabX, PAGE_W);
        s.p += (target - s.p) * k;
        s.phi += (foldAngle(this.drag.grabV, this.drag.v, PAGE_H) - s.phi) * k;
        return;
      }
      if (s.anim) {
        const a = s.anim;
        a.t += dt;
        const u = this.reduced ? 1 : clamp(a.t / a.dur);
        s.p = a.from + (a.to - a.from) * a.curve(u);
        s.phi *= 1 - k * 0.5;
        if (u >= 1) {
          s.anim = null;
          s.p = a.to;
        }
        return;
      }
      // idle: settle on its stack, lift a corner under the pointer
      s.hover += ((this.hoverSheet === i && !this.reduced ? 1 : 0) - s.hover) * k * 0.6;
      if (s.hover > 0.001) {
        s.sign = atRest === 0 ? 1 : -1;
        s.bend = BEND_TURN;
        s.phi += (this.hoverPhi - s.phi) * k;
      }
      s.p = atRest + (atRest === 0 ? 1 : -1) * HOVER_LIFT * s.hover;
    });
  }

  private animate(sheet: number, to: 0 | 1, delay: number, bend: number) {
    const s = this.sheets[sheet];
    s.sign = to === 1 ? 1 : -1;
    s.bend = bend;
    s.anim = { from: s.p, to, t: -delay, dur: bend === BEND_CASCADE ? 0.8 : TURN_DUR, curve: ease.turn };
  }
}
