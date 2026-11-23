/** Animated state for Where Do You Land: bars grow, numbers count, the marker drops. No React. */
import { approach } from "@/lib/tmsc/ease";
import type { Landing } from "./land";

export class LandScene {
  now = 0;
  landing: Landing = { enough: false, n: 0 };
  sentence = "";
  bars: number[] = [];
  median = 0;
  q25 = 0;
  q75 = 0;
  max = 1;
  youX = 0;
  /** When the marker last started dropping, seconds. */
  dropAt = -1e9;
  /** 0..1, how present the chart is (fades out for small groups). */
  presence = 0;
  private metric = "";
  private youKey = "";

  update(l: Landing, sentence: string, metric: string, reduced: boolean) {
    const changed = l !== this.landing;
    this.landing = l;
    this.sentence = sentence;
    if (metric !== this.metric) {
      this.metric = metric;
      this.bars = [];
      this.median = this.q25 = this.q75 = 0;
      if (l.enough) this.max = l.max;
    }
    if (!changed || !l.enough) return;
    if (this.bars.length !== l.bins.length) this.bars = l.bins.map(() => 0);
    const key = `${l.you}|${l.n}|${l.percentile}`;
    if (key !== this.youKey && l.you !== null) {
      this.youKey = key;
      this.dropAt = reduced ? -1e9 : this.now;
      if (this.youX === 0) this.youX = l.you;
    }
  }

  tick(dt: number, now: number, reduced: boolean) {
    this.now = now;
    const k = reduced ? 1e3 : 7;
    const l = this.landing;
    this.presence = approach(this.presence, l.enough ? 1 : 0, dt, reduced ? 1e3 : 6);
    if (!l.enough) return;
    const top = Math.max(1, ...l.bins);
    this.bars = this.bars.map((b, i) => approach(b, (l.bins[i] ?? 0) / top, dt, k));
    this.max = approach(this.max, l.max, dt, k);
    this.median = approach(this.median, l.median, dt, reduced ? 1e3 : 5);
    this.q25 = approach(this.q25, l.q25, dt, k);
    this.q75 = approach(this.q75, l.q75, dt, k);
    if (l.you !== null) this.youX = approach(this.youX, l.you, dt, k * 1.5);
  }
}
