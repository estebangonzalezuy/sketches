import { describe, expect, it } from "vitest";
import raw from "./content.json";
import { displayDate, heroQuote, INTERVIEWS, pageTitle, roleLabel, seriesLabel } from "./content";
import { FACES, SHEET_COUNT, SPREADS, STACK_GAP } from "./data";
import { FlipController } from "./flip-controller";
import { dragProgress, magazineShift, shaderPose, stackHeight } from "./pose";
import { RECORD_DURATION, recordFrame } from "./timeline";

describe("content", () => {
  it("hero quotes are verbatim from content.json and attributed to the guest", () => {
    for (const i of INTERVIEWS) {
      const q = heroQuote(i, SPREADS[i.order].heroQuote);
      const source = raw.interviews.find((r) => r.order === i.order)!;
      expect(source.quotes.map((s) => s.text)).toContain(q.text);
      expect(q.attribution).toBe(i.guest);
    }
  });

  it("never uses the friend's ninety-percent line as Victor's quote", () => {
    const victor = INTERVIEWS.find((i) => i.order === 1)!;
    expect(heroQuote(victor, SPREADS[1].heroQuote).text).not.toMatch(/ninety|90/i);
  });

  it("prints dates without a year", () => {
    expect(INTERVIEWS.map((i) => displayDate(i.post_date))).toEqual(["17 Nov", "3 Nov", "13 Oct", "8 Sep"]);
    for (const i of INTERVIEWS) {
      for (const s of [pageTitle(i), roleLabel(i), seriesLabel(i), displayDate(i.post_date)]) expect(s).not.toMatch(/2026/);
    }
  });

  it("maps a clean spread per interview", () => {
    expect(FACES).toHaveLength(SHEET_COUNT * 2);
    for (let k = 1; k <= 4; k++) {
      const left = FACES.find((f) => f.sheet === k - 1 && f.side === "back")!;
      const right = FACES.find((f) => f.sheet === k && f.side === "front")!;
      expect(left.interviewOrder).toBe(k);
      expect(right.interviewOrder).toBe(k);
    }
  });
});

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
    expect(recordFrame(7.3)).toEqual(recordFrame(7.3));
    expect(recordFrame(RECORD_DURATION).sheets.every((s) => s.p === 0)).toBe(true);
    expect(recordFrame(14.3).sheets.every((s) => s.p === 1)).toBe(true);
    expect(recordFrame(4).sheets.map((s) => s.p)).toEqual([1, 0, 0, 0, 0]);
  });
});

describe("flip controller", () => {
  const settle = (c: FlipController) => {
    for (let i = 0; i < 400; i++) c.update(1 / 60);
  };

  it("turns with keys and flips back home", () => {
    const c = new FlipController();
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
    const c = new FlipController();
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
    const c = new FlipController();
    c.pointerDown(0.5, 0.2);
    c.pointerUp();
    settle(c);
    expect(c.turned).toBe(1);
  });
});
