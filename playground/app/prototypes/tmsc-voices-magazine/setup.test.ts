import { describe, expect, it } from "vitest";

describe("back cover", () => {
  it("points readers to themotionsocialclub.substack.com", async () => {
    const { PUBLICATION_URL } = await import("./content");
    expect(PUBLICATION_URL).toBe("themotionsocialclub.substack.com");
  });
});

describe("cover setup", () => {
  it("defaults to a white type cover and maps the image styles", async () => {
    const { controls } = await import("./controls");
    const { pageSetup } = await import("./setup");
    const { defaultValues } = await import("@/components/controls");
    const { COVER, BACK_COVER } = await import("./data");
    const v = defaultValues(controls);
    expect(pageSetup(v).cover.style).toBe("artwork");
    expect(pageSetup({ ...v, coverLayout: "Orbit" }).cover.style).toBe("orbit");
    expect(pageSetup({ ...v, coverLayout: "Plain" }).cover.style).toBe("type");
    expect([COVER.bg, BACK_COVER.bg]).toEqual(["#FFFFFF", "#FFFFFF"]);
    expect([COVER.ink, BACK_COVER.ink]).toEqual(["#0C0C0C", "#0C0C0C"]);
    const c = pageSetup({ ...v, coverLayout: "Image on color", coverImage: "Feature 4", coverBg: "#cc84fc", coverInk: "White" }).cover;
    expect(c).toMatchObject({ style: "on-color", source: 3, color: "#cc84fc", ink: "#FFFFFF", scale: 1 });
    expect(c.dots).toMatchObject({ on: true, pattern: "Grid" });
    expect(pageSetup({ ...v, coverDots: false }).cover.dots.on).toBe(false);
  });
});

describe("image size", () => {
  it("maps the size sliders to 0.3–1 and survives stale values", async () => {
    const { controls } = await import("./controls");
    const { pageSetup } = await import("./setup");
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
    const { pageInk, backInk, autoInk } = await import("./page-inks");
    const { SPREADS, INK, BACK_COVER } = await import("./data");
    expect(backInk({})).toEqual(BACK_COVER);
    expect(pageInk(undefined, SPREADS[3].right)).toEqual(SPREADS[3].right); // Doug's green ink on white survives
    expect(autoInk("#0C540C")).toBe(INK.white);
    expect(autoInk("#E4FC24")).toBe(INK.black);
    expect(pageInk("#0C0C0C", SPREADS[1].left)).toEqual({ bg: "#0C0C0C", ink: INK.white });
    expect(pageInk("not a color", SPREADS[1].left)).toEqual(SPREADS[1].left);
  });
});

describe("camera", () => {
  it("opens from its start view and lands on the base view without a jump", async () => {
    const { viewAt, cameraFrom, DEFAULT_CAMERA, INTROS, DRIFTS } = await import("./camera");
    for (const intro of INTROS)
      for (const drift of DRIFTS) {
        const c = { ...DEFAULT_CAMERA, tilt: 25, yaw: 10, zoom: 1.2, intro, drift, driftAmount: 1 };
        expect(viewAt(c, 3.3, 20)).toEqual(viewAt(c, 3.3, 20)); // deterministic
        const a = viewAt(c, c.introDur - 1e-4, 20);
        const b = viewAt(c, c.introDur + 1e-4, 20);
        for (const k of ["tilt", "yaw", "zoom"] as const) expect(Math.abs(a[k] - b[k])).toBeLessThan(0.01);
        if (drift === "None") expect(viewAt(c, 15, 20)).toEqual({ tilt: 25, yaw: 10, zoom: 1.2 });
      }
    expect(viewAt({ ...DEFAULT_CAMERA, intro: "Zoom in" }, 0, 20).zoom).toBeLessThan(DEFAULT_CAMERA.zoom);
    expect(viewAt({ ...DEFAULT_CAMERA, intro: "Top-down" }, 0, 20).tilt).toBe(0);
    expect(cameraFrom({ cameraTilt: 999, cameraIntro: "Nope", cameraZoom: 150 })).toMatchObject({ tilt: 70, intro: DEFAULT_CAMERA.intro, zoom: 1.5 });
  });

  it("offers 9:16 for stories", async () => {
    const { recordFormat } = await import("./setup");
    const { RECORD_FORMATS } = await import("./data");
    expect(RECORD_FORMATS[recordFormat({ format: "9:16" })]).toMatchObject({ w: 1080, h: 1920 });
  });
});

describe("palette", () => {
  it("offers the tMSC palette in the panel and Randomize stays inside it", async () => {
    const { controls } = await import("./controls");
    const { randomValues, defaultValues } = await import("@/components/controls");
    const { TMSC_PALETTE } = await import("./data");
    const hexes = TMSC_PALETTE.map((s) => s.hex.toLowerCase());
    expect(hexes).toHaveLength(11);
    let seed = 7;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 20; i++) {
      const v = randomValues(controls, defaultValues(controls), rng);
      for (const k of ["coverBg", "backColor", "textPage", "stageColor"] as const) expect(hexes).toContain(v[k]);
    }
  });
});
