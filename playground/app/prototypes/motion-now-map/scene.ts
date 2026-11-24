/** Respondent map state: layout, dot motion, hover dimming and the zoom camera. No React. */
import { approach, segment } from "@/lib/tmsc/ease";
import type { Respondent } from "@/lib/tmsc/survey";
import { IDENTITY, mixView, toWorld, viewOn, type View } from "./camera";
import { DIM, GROUPINGS, ZOOM_DUR, type GroupingName } from "./data";
import { Dots } from "./dots";
import { keyNumbers, type KeyNumber } from "./group-stats";
import { frameFor, hitCluster, layoutClusters, type Frame, type Layout } from "./clusters";

export type MapSettings = { group: GroupingName; dotSize: number; drift: number; spacing: number; palette: string; reduced: boolean };

export class MapScene {
  w = 0;
  h = 0;
  now = 0;
  people: readonly Respondent[] = [];
  s!: MapSettings;
  frame!: Frame;
  layout!: Layout;
  dots!: Dots;
  clusterOf = new Int16Array(0);
  dim: number[] = [];
  hover = -1;
  focus = -1;
  stats: KeyNumber[] = [];
  view: View = IDENTITY;
  private from: View = IDENTITY;
  private to: View = IDENTITY;
  private viewStart = -1e9;
  /** 0 = overview, 1 = zoomed in; eased for the title and key numbers. */
  zoom = 0;
  private key = "";

  /** Apply data/settings; relayout (animated) only when something that moves dots changed. */
  configure(people: readonly Respondent[], s: MapSettings, w: number, h: number) {
    this.s = s;
    const key = `${w}|${h}|${s.group}|${s.dotSize}|${s.spacing}`;
    if (people === this.people && key === this.key) return;
    const fresh = !this.dots || people.length !== this.people.length || w !== this.w || h !== this.h;
    this.people = people;
    this.key = key;
    this.w = w;
    this.h = h;
    this.frame = frameFor(w, h);
    const g = GROUPINGS[s.group];
    this.layout = layoutClusters(people, g.key, g.order, this.frame, s.dotSize, s.spacing);
    this.clusterOf = new Int16Array(people.length);
    this.layout.clusters.forEach((c, ci) => c.members.forEach((m) => (this.clusterOf[m] = ci)));
    this.dim = this.layout.clusters.map(() => 1);
    if (fresh) this.dots = new Dots(people.length, w, h);
    this.dots.retarget(this.layout.tx, this.layout.ty, this.now + 0.05, s.reduced);
    this.hover = -1;
    this.setFocus(-1, true);
  }

  setFocus(i: number, instant = false) {
    if (i === this.focus && !instant) return;
    this.focus = i;
    this.from = this.view;
    this.viewStart = instant || this.s?.reduced ? -1e9 : this.now;
    if (i < 0) {
      this.to = IDENTITY;
      return;
    }
    const c = this.layout.clusters[i];
    const wide = this.w / this.h > 1.2;
    const s = Math.min(6, Math.max(1, (Math.min(this.w, this.h) * (wide ? 0.27 : 0.24)) / Math.max(1, c.r)));
    this.to = wide ? viewOn(c.cx, c.cy, this.w * 0.3, this.h * 0.58, s) : viewOn(c.cx, c.cy, this.w * 0.5, this.h * 0.44, s);
    this.stats = keyNumbers(c.members.map((m) => this.people[m]));
  }

  tick(dt: number, now: number) {
    this.now = now;
    this.dots.update(now);
    const p = segment(now, this.viewStart, ZOOM_DUR);
    this.view = mixView(this.from, this.to, p);
    const lit = this.focus >= 0 ? this.focus : this.hover;
    // hover dims the rest to 25%; zoomed in, they step further back behind the key numbers
    const low = this.focus >= 0 ? DIM * 0.4 : DIM;
    this.dim = this.dim.map((d, i) => approach(d, lit < 0 || lit === i ? 1 : low, dt, 12));
    this.zoom = approach(this.zoom, this.focus >= 0 ? 1 : 0, dt, this.s.reduced ? 1e3 : 6);
  }

  pointer(type: "down" | "move" | "up" | "leave", x: number, y: number) {
    const w = toWorld(this.view, x, y);
    const hit = hitCluster(this.layout, w.x, w.y);
    if (type === "move") this.hover = hit;
    else if (type === "leave") this.hover = -1;
    else if (type === "down") this.setFocus(hit === this.focus ? -1 : hit);
  }

  cursor(): string {
    return this.hover >= 0 || this.focus >= 0 ? "pointer" : "default";
  }
}
