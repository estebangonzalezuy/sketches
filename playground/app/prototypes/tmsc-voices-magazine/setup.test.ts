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
    expect(c).toEqual({ style: "on-color", source: 3, color: "#cc84fc", ink: "#FFFFFF", scale: 1 });
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
