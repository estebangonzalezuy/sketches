import { defineControls, type ControlValues } from "@/components/controls";
import { BACK_COVER, COVER, SPREADS } from "./data";
import { coverOption, mediaOptions, resolveMedia, type MediaChoice } from "./media";
import { pageInk, pageInks, type PageInks } from "./page-inks";
import type { PageInk, RecordFormat } from "./types";

/** How each spread is put together: which image from the post, which frame of it, how it sits. */

const DEFAULT_FRAME = { 1: 1, 2: 3, 3: 3, 4: 1 } as const;
/** Default Q&A images (indices into the post's images): two that aren't the cover. */
const EDITORIAL_IMAGES = { 1: [1, 2], 2: [0, 1], 3: [0, 1], 4: [4, 1] } as const;
const EDITORIAL_FRAME = 3;

const spread = (order: 1 | 2 | 3 | 4, name: string) =>
  ({
    [`${name}Image`]: { type: "select", label: `${cap(name)} image`, options: mediaOptions(order), default: coverOption(order) },
    [`${name}Frame`]: { type: "number", label: `${cap(name)} frame`, min: 1, max: 6, step: 1, default: DEFAULT_FRAME[order] },
    [`${name}Left`]: { type: "color", label: `${cap(name)} left page`, default: SPREADS[order].left.bg },
    [`${name}Right`]: { type: "color", label: `${cap(name)} right page`, default: SPREADS[order].right.bg },
    [`${name}TextImage1`]: { type: "select", label: `${cap(name)} Q&A image 1`, options: mediaOptions(order), default: mediaOptions(order)[EDITORIAL_IMAGES[order][0]] },
    [`${name}TextImage2`]: { type: "select", label: `${cap(name)} Q&A image 2`, options: mediaOptions(order), default: mediaOptions(order)[EDITORIAL_IMAGES[order][1]] },
  }) as const;

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const controls = defineControls({
  ...spread(1, "victor"),
  ...spread(2, "thais"),
  ...spread(3, "doug"),
  ...spread(4, "justin"),
  imageFit: { type: "select", label: "Image", options: ["Fit", "Fill"], default: "Fit" },
  imageSize: { type: "number", label: "Image size %", min: 30, max: 100, step: 5, default: 100 },
  editorial: { type: "boolean", label: "Q&A pages", default: true },
  textColumns: { type: "select", label: "Q&A columns", options: ["1", "2", "3"], default: "2" },
  textSize: { type: "select", label: "Q&A text", options: ["Small", "Medium", "Large"], default: "Medium" },
  textImageSize: { type: "number", label: "Q&A image size %", min: 30, max: 100, step: 5, default: 100 },
  textPage: { type: "color", label: "Q&A page color", default: "#FFFFFF" },
  coverStyle: { type: "select", label: "Cover", options: ["Type", "Full image", "Image on color"], default: "Type" },
  coverImage: { type: "select", label: "Cover image", options: ["Uploaded", "Victor", "Thais", "Doug", "Justin"], default: "Uploaded" },
  coverBg: { type: "color", label: "Cover color", default: COVER.bg },
  coverImageSize: { type: "number", label: "Cover image size %", min: 30, max: 100, step: 5, default: 100 },
  coverInk: { type: "select", label: "Cover type", options: ["Black", "White"], default: "Black" },
  backColor: { type: "color", label: "Back cover color", default: BACK_COVER.bg },
  stageColor: { type: "color", label: "Background", default: "#EAEAEA" },
  stagePaper: { type: "boolean", label: "Background paper", default: true },
  stageGrid: { type: "boolean", label: "Grid", default: false },
  format: { type: "select", label: "Export", options: ["1:1", "4:5"], default: "1:1", randomize: false },
});

export type Values = ControlValues<typeof controls>;

export type CoverSetup = {
  style: "type" | "full" | "on-color";
  /** "upload" or the interview whose picked image goes on the cover */
  source: "upload" | 1 | 2 | 3 | 4;
  color: string;
  ink: string;
  /** 0.3–1 of the space the image may take (Image on color) */
  scale: number;
};

export type EditorialSetup = {
  on: boolean;
  columns: number;
  textSize: "Small" | "Medium" | "Large";
  imageScale: number;
  ink: PageInk;
  images: Record<1 | 2 | 3 | 4, [MediaChoice, MediaChoice]>;
};

export type PageSetup = {
  media: Record<1 | 2 | 3 | 4, MediaChoice>;
  fill: boolean;
  /** 0.3–1 */
  imageScale: number;
  cover: CoverSetup;
  inks: PageInks;
  editorial: EditorialSetup;
};

export type StageSetup = { color: string; paper: boolean; grid: boolean };

const COVER_STYLE = { Type: "type", "Full image": "full", "Image on color": "on-color" } as const;
const COVER_SOURCE = { Uploaded: "upload", Victor: 1, Thais: 2, Doug: 3, Justin: 4 } as const;

/** A percent control → 0.3…1, tolerant of stale stored values. */
const toScale = (p: unknown) => Math.min(1, Math.max(0.3, (Number(p) || 100) / 100));

const NAMES = { 1: "victor", 2: "thais", 3: "doug", 4: "justin" } as const;

export function pageSetup(v: Record<string, unknown>): PageSetup {
  const pick = (order: 1 | 2 | 3 | 4) =>
    resolveMedia(order, String(v[`${NAMES[order]}Image`]), Number(v[`${NAMES[order]}Frame`]));
  const cover: CoverSetup = {
    style: COVER_STYLE[v.coverStyle as keyof typeof COVER_STYLE] ?? "type",
    source: COVER_SOURCE[v.coverImage as keyof typeof COVER_SOURCE] ?? "upload",
    color: /^#[0-9a-f]{6}$/i.test(String(v.coverBg)) ? String(v.coverBg) : COVER.bg,
    // the cover ink is printed black or white, never a UI color
    ink: v.coverInk === "White" ? "#FFFFFF" : "#0C0C0C",
    scale: toScale(v.coverImageSize),
  };
  const edImages = (o: 1 | 2 | 3 | 4): [MediaChoice, MediaChoice] => [
    resolveMedia(o, String(v[`${NAMES[o]}TextImage1`]), EDITORIAL_FRAME),
    resolveMedia(o, String(v[`${NAMES[o]}TextImage2`]), EDITORIAL_FRAME),
  ];
  const editorial: EditorialSetup = {
    on: v.editorial !== false,
    columns: Math.min(3, Math.max(1, Number(v.textColumns) || 2)),
    textSize: v.textSize === "Small" || v.textSize === "Large" ? v.textSize : "Medium",
    imageScale: toScale(v.textImageSize),
    ink: pageInk(v.textPage, { bg: "#FFFFFF", ink: "#0C0C0C" }),
    images: { 1: edImages(1), 2: edImages(2), 3: edImages(3), 4: edImages(4) },
  };
  return { media: { 1: pick(1), 2: pick(2), 3: pick(3), 4: pick(4) }, fill: v.imageFit === "Fill", imageScale: toScale(v.imageSize), cover, inks: pageInks(v), editorial };
}

const HEX = /^#[0-9a-f]{6}$/i;

export function stageSetup(v: Record<string, unknown>): StageSetup {
  return { color: HEX.test(String(v.stageColor)) ? String(v.stageColor) : "#EAEAEA", paper: v.stagePaper !== false, grid: v.stageGrid === true };
}

export function recordFormat(v: Record<string, unknown>): RecordFormat {
  return v.format === "4:5" ? "portrait" : "square";
}
