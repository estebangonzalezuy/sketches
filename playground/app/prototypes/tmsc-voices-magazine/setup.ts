import { COVER } from "./data";
import { resolveMedia, type MediaChoice } from "./media";
import { pageInk, pageInks, type PageInks } from "./page-inks";
import { TEXTURES, type TextureKind } from "./textures";
import type { PageInk, RecordFormat } from "./types";

/** Panel values → what the bake, the stage and Record need. Tolerant of stale stored values. */

const EDITORIAL_FRAME = 3;
const texture = (kind: unknown, strength: unknown, fallback: TextureKind | "None"): { kind: TextureKind | "None"; strength: number } => ({
  kind: kind === "None" || TEXTURES.includes(kind as TextureKind) ? (kind as TextureKind | "None") : fallback,
  strength: Math.min(2, Math.max(0, Number.isFinite(Number(strength)) ? Number(strength) / 100 : 1)),
});


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
  texture: TextureChoice;
};

export type TextureChoice = { kind: TextureKind | "None"; strength: number };
export type StageSetup = { color: string; texture: TextureChoice; grid: boolean };

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
  return { media: { 1: pick(1), 2: pick(2), 3: pick(3), 4: pick(4) }, fill: v.imageFit === "Fill", imageScale: toScale(v.imageSize), cover, inks: pageInks(v), editorial, texture: texture(v.pageTexture, v.pageTextureStrength, "Newsprint") };
}

const HEX = /^#[0-9a-f]{6}$/i;

export function stageSetup(v: Record<string, unknown>): StageSetup {
  return { color: HEX.test(String(v.stageColor)) ? String(v.stageColor) : "#EAEAEA", texture: texture(v.stageTexture, v.stageTextureStrength, "Newsprint"), grid: v.stageGrid === true };
}

export function recordFormat(v: Record<string, unknown>): RecordFormat {
  return v.format === "4:5" ? "portrait" : "square";
}
