import { BACK_COVER, INK } from "./data";
import type { PageInk } from "./types";

/**
 * Page colors picked in the editor or the panel (user data). Type stays readable: black or
 * white by the background's luminance. A page left on its designed color keeps its designed ink.
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

export const backInk = (v: Record<string, unknown>) => pageInk(v.backColor, BACK_COVER);
