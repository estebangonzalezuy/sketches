/**
 * tMSC brand palettes. Every piece uses at most two brand colors plus black or white:
 * a flat background, one ink for type and dots, and one accent for emphasis.
 * These are brand data picked by the user, not UI styling, so they are hex values on purpose.
 */
export type Palette = { bg: string; fg: string; accent: string };

export const BRAND = {
  acid: "#E4FC24",
  ink: "#0C0C0C",
  lilac: "#CC84FC",
  brown: "#3C240C",
  magenta: "#F06CCC",
  green: "#0C540C",
  white: "#FFFFFF",
  periwinkle: "#ADB4F5",
  yellow: "#F4C500",
  orange: "#EE4B2B",
  leaf: "#2E7D46",
} as const;

const B = BRAND;

export const PALETTES = {
  "Acid on ink": { bg: B.ink, fg: B.white, accent: B.acid },
  "Ink on acid": { bg: B.acid, fg: B.ink, accent: B.ink },
  "Lilac on brown": { bg: B.brown, fg: B.white, accent: B.lilac },
  "Brown on lilac": { bg: B.lilac, fg: B.brown, accent: B.brown },
  "Magenta on green": { bg: B.green, fg: B.white, accent: B.magenta },
  "Green on magenta": { bg: B.magenta, fg: B.green, accent: B.green },
  "Ink on white": { bg: B.white, fg: B.ink, accent: B.ink },
  "White on ink": { bg: B.ink, fg: B.white, accent: B.white },
  Periwinkle: { bg: B.periwinkle, fg: B.ink, accent: B.ink },
  Yellow: { bg: B.yellow, fg: B.ink, accent: B.ink },
  Orange: { bg: B.orange, fg: B.ink, accent: B.white },
  Leaf: { bg: B.leaf, fg: B.white, accent: B.ink },
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof PALETTES;
export const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];

export function palette(name: string): Palette {
  return (PALETTES as Record<string, Palette>)[name] ?? PALETTES["Acid on ink"];
}

/** Report chapters. Each one owns a palette pair; `dark` picks the dark background side. */
export const CHAPTERS = {
  Money: { number: "01", dark: "Acid on ink", color: "Ink on acid" },
  "What’s Next": { number: "02", dark: "Lilac on brown", color: "Brown on lilac" },
  "Human + Tool": { number: "03", dark: "Magenta on green", color: "Green on magenta" },
} as const satisfies Record<string, { number: string; dark: PaletteName; color: PaletteName }>;

export type ChapterName = keyof typeof CHAPTERS;
export const CHAPTER_NAMES = Object.keys(CHAPTERS) as ChapterName[];

/** `#rrggbb` + alpha → `rgba()` for canvas. Dimming one brand color never adds a new one. */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}
