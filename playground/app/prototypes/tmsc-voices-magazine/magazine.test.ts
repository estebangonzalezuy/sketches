import { describe, expect, it } from "vitest";
import { STACK_GAP } from "./data";
import { buildBook } from "./faces";
import { FlipController } from "./flip-controller";
import { dragProgress, magazineShift, shaderPose, stackHeight } from "./pose";
import { recordFrame, recordPlan } from "./timeline";
import { DEFAULT_TIMING } from "./timing";

const SHEET_COUNT = 5;
const FOUR = ["Victor Verdugo", "Thais Macedo", "Doug Alberts", "Justin Cone"].map((guest, i) => ({ id: `f${i}`, guest }));

describe("pose", () => {
  it("lies flat on either stack and never passes the spine angle", () => {
    expect(shaderPose(0, 1, 1)).toEqual({ root: 0, bend: 0 });
    expect(shaderPose(1, 1, 1).root).toBeCloseTo(Math.PI);
    for (let p = 0; p <= 1; p += 0.01) {
      for (const sign of [1, -1] as const) {
        const { root, bend } = shaderPose(p, sign, 0.95);
        const edge = root + sign * bend;
        expect(edge).toBeGreaterThanOrEqual(-1e-9);
        expect(edge).toBeLessThanOrEqual(Math.PI + 1e-9);
      }
    }
  });

  it("keeps stack order: the turning sheet ends above everything it lands on", () => {
    for (let k = 0; k < SHEET_COUNT; k++) {
      expect(stackHeight(k, 0, SHEET_COUNT, STACK_GAP)).toBeGreaterThan(stackHeight(k + 1, 0, SHEET_COUNT, STACK_GAP));
      if (k > 0) expect(stackHeight(k, 1, SHEET_COUNT, STACK_GAP)).toBeGreaterThan(stackHeight(k - 1, 1, SHEET_COUNT, STACK_GAP));
    }
  });

  it("centers a closed magazine", () => {
    expect(magazineShift(0, 5, 1)).toBe(-0.5);
    expect(magazineShift(2.5, 5, 1)).toBe(0);
    expect(magazineShift(5, 5, 1)).toBe(0.5);
  });

  it("drags the grabbed point across to its mirror", () => {
    expect(dragProgress(0.8, 0.8, 1)).toBeCloseTo(0);
    expect(dragProgress(-0.8, 0.8, 1)).toBeCloseTo(1);
    expect(dragProgress(0.8, -0.8, 1)).toBeCloseTo(0);
  });
});

describe("record timeline", () => {
  it("is deterministic, ends on the cover and visits the back cover", () => {
    for (const editorial of [false, true]) {
      const plan = recordPlan(buildBook(FOUR, editorial), DEFAULT_TIMING);
      expect(recordFrame(plan, 7.3)).toEqual(recordFrame(plan, 7.3));
      expect(recordFrame(plan, plan.duration).sheets.every((s) => s.p === 0)).toBe(true);
      expect(recordFrame(plan, 4).sheets.map((s) => s.p)).toEqual([1, ...Array(plan.sheets - 1).fill(0)]);
      const cascade = Math.min(...plan.turns.filter((t) => t.dir === -1).map((t) => t.start));
      expect(recordFrame(plan, cascade - 0.05).sheets.every((s) => s.p === 1)).toBe(true);
    }
    expect(recordPlan(buildBook(FOUR, false), DEFAULT_TIMING).duration).toBeLessThan(20);
  });
});

describe("flip controller", () => {
  const settle = (c: FlipController) => {
    for (let i = 0; i < 400; i++) c.update(1 / 60);
  };

  it("turns with keys and flips back home", () => {
    const c = new FlipController(SHEET_COUNT);
    c.turn(1);
    c.turn(1);
    settle(c);
    expect(c.turned).toBe(2);
    expect(c.sheets.map((s) => s.p)).toEqual([1, 1, 0, 0, 0]);
    c.goTo(0);
    settle(c);
    expect(c.sheets.every((s) => s.p === 0)).toBe(true);
  });

  it("cancels a short drag and commits a long one", () => {
    const c = new FlipController(SHEET_COUNT);
    c.pointerDown(0.9, 0);
    c.pointerMove(0.6, 0, 1 / 60);
    for (let i = 0; i < 60; i++) c.update(1 / 60);
    c.pointerMove(0.6, 0, 0.5);
    c.pointerUp();
    settle(c);
    expect(c.turned).toBe(0);
    c.pointerDown(0.9, 0);
    c.pointerMove(-0.5, 0, 0.5);
    for (let i = 0; i < 60; i++) c.update(1 / 60);
    c.pointerUp();
    settle(c);
    expect(c.turned).toBe(1);
  });

  it("turns on a click", () => {
    const c = new FlipController(SHEET_COUNT);
    c.pointerDown(0.5, 0.2);
    c.pointerUp();
    settle(c);
    expect(c.turned).toBe(1);
  });
});

describe("Q&A text", () => {
  it("is verbatim from the posts and only places whole paragraphs", async () => {
    const { flow, columns } = await import("./editorial-flow");
    const curated = (await import("./editorial.json")).default.interviews as Record<string, { kind: "q" | "a"; text: string }[]>;
    const EDITORIAL = curated as Record<"1" | "2" | "3" | "4", { kind: "q" | "a"; text: string }[]>;
    for (const o of ["1", "2", "3", "4"] as const) {
      const blocks = EDITORIAL[o];
      expect(blocks.length).toBeGreaterThan(10);
      expect(blocks[0].kind).toBe("q");
    }
    // a monospace stand-in measure: 10 units per character
    const measure = (s: string) => s.length * 10;
    const frames = [...columns(0, 0, 0, 1000, 600, 2, 40), ...columns(1, 0, 0, 1000, 600, 2, 40)];
    const { lines, placed, partial } = flow(EDITORIAL["1"], frames, 30, 15, measure);
    expect(placed).toBeGreaterThan(0);
    expect(placed).toBeLessThan(EDITORIAL["1"].length);
    // the placed lines spell the first paragraphs verbatim; a cut last answer ends on a whole sentence
    const text = lines.map((l) => l.text).join(" ");
    const whole = EDITORIAL["1"].slice(0, placed - (partial ? 1 : 0)).map((b) => b.text).join(" ");
    expect(text.startsWith(whole)).toBe(true);
    if (partial) {
      const rest = text.slice(whole.length).trim();
      expect(EDITORIAL["1"][placed - 1].text.startsWith(rest)).toBe(true);
      expect(rest).toMatch(/[.!?…]$/);
    } else expect(text).toBe(whole);
    expect(lines.every((l) => l.y + 30 <= 600)).toBe(true);
  });

  it("never ends on a question", async () => {
    const { flow } = await import("./editorial-flow");
    const blocks = [
      { kind: "a" as const, text: "one two" },
      { kind: "q" as const, text: "a question" },
      { kind: "a" as const, text: "a very long answer that will not fit anywhere at all in this tiny frame" },
    ];
    const { placed } = flow(blocks, [{ page: 0, x: 0, y: 0, w: 120, h: 60 }], 30, 0, (s) => s.length * 10);
    expect(placed).toBe(1);
  });
});

describe("easing and timing", () => {
  it("matches the bézier presets at their ends and is monotonic", async () => {
    const { cubicBezier, easeFn, EASE_NAMES } = await import("./easing");
    expect(cubicBezier(0, 0, 1, 1)(0.3)).toBeCloseTo(0.3, 4);
    for (const n of EASE_NAMES) {
      const f = easeFn(n);
      expect(f(0)).toBe(0);
      expect(f(1)).toBe(1);
      let last = 0;
      for (let x = 0.05; x <= 1; x += 0.05) {
        expect(f(x)).toBeGreaterThanOrEqual(last - 1e-6);
        last = f(x);
      }
    }
    expect(easeFn("Ease out")(0.2)).toBeGreaterThan(easeFn("Ease in")(0.2));
  });

  it("stretches the sequence with longer turns and per-segment edits", async () => {
    const { timingFrom, withOverride, withEase, withoutOverride } = await import("./timing");
    const book = buildBook(FOUR, false);
    const base = recordPlan(book, DEFAULT_TIMING).duration;
    const slow = timingFrom({ turnDuration: 2 }, {});
    expect(recordPlan(book, slow).duration).toBeCloseTo(base + book.sheets * 1, 5);
    const o = withOverride({}, 2, "hold", 3);
    const plan = recordPlan(book, { ...DEFAULT_TIMING, overrides: withEase(o, 1, "Linear") });
    expect(plan.segments.find((s) => s.kind === "hold" && s.key === 2)!.dur).toBe(3);
    expect(plan.segments.find((s) => s.kind === "turn" && s.key === 1)!.ease).toBe("Linear");
    expect(withoutOverride(o, 2, "hold")).toEqual({});
    // out-of-range stored values fall back or clamp
    expect(timingFrom({ turnDuration: -1, turnEase: "Nope" }, {}).turn).toBe(DEFAULT_TIMING.turn);
    expect(withOverride({}, 0, "turn", 99)[0].turn).toBe(4);
  });

  it("segments tile the sequence with no gaps", () => {
    const plan = recordPlan(buildBook(FOUR, true), DEFAULT_TIMING);
    for (let i = 1; i < plan.segments.length; i++) {
      const a = plan.segments[i - 1];
      expect(plan.segments[i].start).toBeCloseTo(a.start + a.dur, 6);
    }
    const last = plan.segments[plan.segments.length - 1];
    expect(last.start + last.dur).toBeCloseTo(plan.duration, 6);
  });
});

describe("paper", () => {
  it("reads the panel safely and orders weights from bendy to stiff", async () => {
    const { paperFrom, weightParams, finishMaterial, DEFAULT_PAPER } = await import("./paper");
    expect(paperFrom({})).toEqual(DEFAULT_PAPER);
    expect(paperFrom({ paperFinish: "Velvet", paperRelief: 999, paperWaviness: -5 })).toMatchObject({ finish: "Matte", relief: 2, waviness: 0 });
    const [l, r, h] = (["Light", "Regular", "Heavy"] as const).map(weightParams);
    expect(l.bend).toBeGreaterThan(r.bend);
    expect(r.bend).toBeGreaterThan(h.bend);
    expect(h.gap).toBeGreaterThan(l.gap);
    expect(finishMaterial("Matte")).toEqual({ model: "lambert" });
    const gloss = finishMaterial("Gloss");
    const satin = finishMaterial("Satin");
    expect(gloss.model === "standard" && satin.model === "standard" && gloss.roughness < satin.roughness).toBe(true);
  });

  it("a heavier bend never pushes the edge past the stacks", () => {
    for (const bend of [0.95 * 1.3, 0.95 * 0.65])
      for (let p = 0; p <= 1; p += 0.02)
        for (const sign of [1, -1] as const) {
          const { root, bend: b } = shaderPose(p, sign, bend);
          expect(root + sign * b).toBeGreaterThanOrEqual(-1e-9);
          expect(root + sign * b).toBeLessThanOrEqual(Math.PI + 1e-9);
        }
  });
});
