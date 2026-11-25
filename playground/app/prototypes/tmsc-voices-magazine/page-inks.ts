import { BACK_COVER, INK, SPREADS } from "./data";
import type { PageInk } from "./types";

/**
 * Page colors picked in the panel (user data). Type stays readable: black or white by the
 * background's luminance. A page left on its designed color keeps its designed ink.
 */

const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Black type on light paper, white on dark (contrast crossover ≈ 0.18 luminance). */
export function autoInk(bg: string): string {
  return luminance(bg) > 0.18 ? INK.black : INK.white;
}

export function pageInk(picked: unknown, designed: PageInk): PageInk {
  const bg = typeof picked === "string" && HEX.test(picked) ? picked : designed.bg;
  if (bg.toLowerCase() === designed.bg.toLowerCase()) return designed;
  return { bg, ink: autoInk(bg) };
}

export type PageInks = { spreads: Record<1 | 2 | 3 | 4, { left: PageInk; right: PageInk }>; back: PageInk };

const NAMES = { 1: "victor", 2: "thais", 3: "doug", 4: "justin" } as const;

export function pageInks(v: Record<string, unknown>): PageInks {
  const spread = (o: 1 | 2 | 3 | 4) => ({
    left: pageInk(v[`${NAMES[o]}Left`], SPREADS[o].left),
    right: pageInk(v[`${NAMES[o]}Right`], SPREADS[o].right),
  });
  return { spreads: { 1: spread(1), 2: spread(2), 3: spread(3), 4: spread(4) }, back: pageInk(v.backColor, BACK_COVER) };
}
