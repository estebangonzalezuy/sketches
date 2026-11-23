/** Holds the live morph: smoothed progress, Play, chapter switches, cached slots. No React. */
import { approach, segment, type EASES } from "@/lib/tmsc/ease";
import type { ChapterName } from "@/lib/tmsc/palettes";
import type { Respondent } from "@/lib/tmsc/survey";
import { cloud, geometry, type MorphState } from "./morph";
import { chapterSlots, type Slots } from "./slots";

const SWITCH_DUR = 0.9;

export class MorphController {
  p = 0;
  now = 0;
  playing: { start: number; from: number } | null = null;
  private people: readonly Respondent[] = [];
  private size = "";
  private chapter: ChapterName | null = null;
  private cache = new Map<ChapterName, Slots>();
  private cloudPts = cloud(0, 1, 1);
  private prev: Slots | null = null;
  private switchedAt = -1e9;

  slotsFor(chapter: ChapterName): Slots {
    let s = this.cache.get(chapter);
    if (!s) {
      const [w, h] = this.size.split("x").map(Number);
      s = chapterSlots(chapter, this.people, geometry(w, h).chart);
      this.cache.set(chapter, s);
    }
    return s;
  }

  sync(people: readonly Respondent[], chapter: ChapterName, w: number, h: number) {
    const size = `${w}x${h}`;
    if (people !== this.people || size !== this.size) {
      this.people = people;
      this.size = size;
      this.cache.clear();
      this.cloudPts = cloud(people.length, w, h);
      this.prev = null;
      this.chapter = chapter;
    }
    if (chapter !== this.chapter) {
      this.prev = this.chapter ? this.slotsFor(this.chapter) : null;
      this.switchedAt = this.now;
      this.chapter = chapter;
    }
  }

  /** Run the morph forward from where it is (from the cloud if it already finished). */
  play() {
    this.playing = { start: this.now, from: this.p >= 0.999 ? 0 : this.p };
    if (this.playing.from === 0) this.p = 0;
  }

  /** Advance. Returns the progress Play wants the slider at, if playing. */
  tick(dt: number, now: number, target: number, duration: number, reduced: boolean): number | null {
    this.now = now;
    let out: number | null = null;
    if (this.playing) {
      const { start, from } = this.playing;
      out = Math.min(1, from + (now - start) / duration);
      if (out >= 1) this.playing = null;
      target = out;
    }
    this.p = reduced ? target : approach(this.p, target, dt, 10);
    return out;
  }

  state(chapter: ChapterName, easing: keyof typeof EASES, stagger: number, p = this.p, now = this.now): MorphState {
    const blend = this.prev ? segment(now, this.switchedAt, SWITCH_DUR) : 1;
    if (blend >= 1) this.prev = null;
    return { chapter, p, now, easing, stagger, cloud: this.cloudPts, slots: this.slotsFor(chapter), prev: this.prev, blend, n: this.people.length };
  }
}
