import type { PageFace, RecordFormat, SpreadTheme } from "./types";

export const SLUG = "tmsc-voices-magazine";
export const ASSET_BASE = `/prototype-assets/${SLUG}`;
export const FONT_URL = "/shared/fonts/mb/archivo-narrow-latin-wght-normal.woff2";
export const FONT_FAMILY = "tMSC Voices Narrow";

/** Page size in world units (one page is 1 wide) and in baked texture pixels. Small-zine ratio 0.72. */
export const PAGE_W = 1;
export const PAGE_H = 1 / 0.72;
export const PAGE_PX = { w: 1440, h: 2000 } as const;
/** Smaller bake for phones: still sharp at that size, a third of the GPU memory. */
export const PAGE_PX_SMALL = { w: 1008, h: 1400 } as const;

export const SHEET_COUNT = 5;
/** Height between stacked sheets: enough for the depth buffer, too thin to read as a gap. */
export const STACK_GAP = 0.0032;
export const SEGMENTS = { u: 96, v: 24 } as const;

/** Bend at mid-turn for a normal turn, and for the quick flip-through. */
export const BEND_TURN = 0.95;
export const BEND_CASCADE = 0.42;
/** How far (as a fraction of page width) the cylinder fold runs from the grabbed edge. */
export const FOLD_LENGTH = 0.82;
/** Hover corner lift, as turn progress. */
export const HOVER_LIFT = 0.028;

/**
 * The tMSC palette. These are the magazine's printed inks (content), not UI colors, so they
 * are allowed as hex here. Never #0000FF, #3D3DEB or #FF0000.
 */
export const INK = {
  black: "#0C0C0C",
  white: "#FFFFFF",
  lime: "#E4FC24",
  lilac: "#CC84FC",
  brown: "#3C240C",
  pink: "#F06CCC",
  green: "#0C540C",
  periwinkle: "#ADB4F5",
  yellow: "#F4C500",
  tomato: "#EE4B2B",
} as const;

export const COVER = { bg: INK.lime, ink: INK.black };
export const BACK_COVER = { bg: INK.black, ink: INK.white, accent: INK.lime };

/** One spread per interview, 2–3 inks each. Keyed by interview order. */
export const SPREADS: Record<1 | 2 | 3 | 4, SpreadTheme> = {
  1: { left: { bg: INK.white, ink: INK.black }, right: { bg: INK.tomato, ink: INK.black }, heroQuote: 0, still: "victor.jpg" },
  2: { left: { bg: INK.lilac, ink: INK.black }, right: { bg: INK.lime, ink: INK.black }, heroQuote: 0, still: "thais.jpg" },
  3: { left: { bg: INK.green, ink: INK.white }, right: { bg: INK.white, ink: INK.green }, heroQuote: 1, still: "doug.jpg" },
  4: { left: { bg: INK.black, ink: INK.white }, right: { bg: INK.periwinkle, ink: INK.black }, heroQuote: 2, still: "justin.jpg" },
};

/**
 * Saddle-stitched sheets. Spread k shows the back of sheet k−1 (left) and the front of
 * sheet k (right), so each interview gets a clean two-page spread.
 */
export const FACES: PageFace[] = [
  { id: "cover", sheet: 0, side: "front", layout: "cover" },
  { id: "victor-a", sheet: 0, side: "back", layout: "interview-left", interviewOrder: 1 },
  { id: "victor-b", sheet: 1, side: "front", layout: "interview-right", interviewOrder: 1 },
  { id: "thais-a", sheet: 1, side: "back", layout: "interview-left", interviewOrder: 2 },
  { id: "thais-b", sheet: 2, side: "front", layout: "interview-right", interviewOrder: 2 },
  { id: "doug-a", sheet: 2, side: "back", layout: "interview-left", interviewOrder: 3 },
  { id: "doug-b", sheet: 3, side: "front", layout: "interview-right", interviewOrder: 3 },
  { id: "justin-a", sheet: 3, side: "back", layout: "interview-left", interviewOrder: 4 },
  { id: "justin-b", sheet: 4, side: "front", layout: "interview-right", interviewOrder: 4 },
  { id: "back-cover", sheet: 4, side: "back", layout: "back-cover" },
];

export const SPREAD_NAMES = ["Cover", "Victor Verdugo", "Thais Macedo", "Doug Alberts", "Justin Cone", "Back cover"];

export const RECORD_FORMATS: Record<RecordFormat, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: "1:1" },
  portrait: { w: 1080, h: 1350, label: "4:5" },
};
export const RECORD_FPS = 60;
