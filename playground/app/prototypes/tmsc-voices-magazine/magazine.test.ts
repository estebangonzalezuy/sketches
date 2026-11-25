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

describe("media", () => {
  it("defaults each spread to its post's cover and resolves frames safely", async () => {
    const { controls, pageSetup } = await import("./controls");
    const { defaultValues } = await import("@/components/controls");
    const { existsSync } = await import("node:fs");
    const setup = pageSetup(defaultValues(controls));
    for (const o of [1, 2, 3, 4] as const) {
      const m = setup.media[o]!;
      expect(m.asset.cover).toBe(true);
      expect(existsSync(`public${m.url}`)).toBe(true);
    }
    const { resolveMedia, MEDIA, mediaOptions, NO_IMAGE } = await import("./media");
    expect(resolveMedia(4, mediaOptions(4)[2], 6)!.frame).toBe(0); // a still has one frame
    expect(resolveMedia(1, NO_IMAGE, 1)).toBeNull();
    for (const o of [1, 2, 3, 4] as const)
      for (const a of MEDIA[o]) for (let f = 0; f < a.frames; f++) expect(existsSync(`public/prototype-assets/tmsc-voices-magazine/media/${a.id}-${f}.jpg`)).toBe(true);
  });
});

describe("back cover", () => {
  it("points readers to themotionsocialclub.substack.com", async () => {
    const { PUBLICATION_URL } = await import("./content");
    expect(PUBLICATION_URL).toBe("themotionsocialclub.substack.com");
  });
});

describe("cover setup", () => {
  it("defaults to a white type cover and maps the image styles", async () => {
    const { controls, pageSetup } = await import("./controls");
    const { defaultValues } = await import("@/components/controls");
    const { COVER, BACK_COVER } = await import("./data");
    const v = defaultValues(controls);
    expect(pageSetup(v).cover.style).toBe("type");
    expect([COVER.bg, BACK_COVER.bg]).toEqual(["#FFFFFF", "#FFFFFF"]);
    expect([COVER.ink, BACK_COVER.ink]).toEqual(["#0C0C0C", "#0C0C0C"]);
    const c = pageSetup({ ...v, coverStyle: "Image on color", coverImage: "Doug", coverBg: "#cc84fc", coverInk: "White" }).cover;
    expect(c).toEqual({ style: "on-color", source: 3, color: "#cc84fc", ink: "#FFFFFF", scale: 1 });
  });
});

describe("image size", () => {
  it("maps the size sliders to 0.3–1 and survives stale values", async () => {
    const { controls, pageSetup } = await import("./controls");
    const { defaultValues } = await import("@/components/controls");
    const v = defaultValues(controls);
    expect(pageSetup(v).imageScale).toBe(1);
    expect(pageSetup({ ...v, imageSize: 50, coverImageSize: 40 }).imageScale).toBe(0.5);
    expect(pageSetup({ ...v, coverImageSize: 40 }).cover.scale).toBe(0.4);
    expect(pageSetup({ ...v, imageSize: 5 }).imageScale).toBe(0.3);
    expect(pageSetup({ ...v, imageSize: undefined }).imageScale).toBe(1);
  });
});

describe("page colors", () => {
  it("keeps the designed inks by default and picks readable type for a new color", async () => {
    const { pageInk, pageInks, autoInk } = await import("./page-inks");
    const { SPREADS, INK, BACK_COVER } = await import("./data");
    const { controls } = await import("./controls");
    const { defaultValues } = await import("@/components/controls");
    const inks = pageInks(defaultValues(controls));
    expect(inks.spreads[3].right).toEqual(SPREADS[3].right); // Doug's green ink on white survives
    expect(inks.back).toEqual(BACK_COVER);
    expect(autoInk("#0C540C")).toBe(INK.white);
    expect(autoInk("#E4FC24")).toBe(INK.black);
    expect(pageInk("#0C0C0C", SPREADS[1].left)).toEqual({ bg: "#0C0C0C", ink: INK.white });
    expect(pageInk("not a color", SPREADS[1].left)).toEqual(SPREADS[1].left);
  });
});
