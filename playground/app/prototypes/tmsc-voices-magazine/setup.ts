import { DOT_PATTERNS, type CoverDots, type DotPattern } from "./cover-dots";
import { COVER } from "./data";
import { backInk, pageInk } from "./page-inks";
import { TEXTURES, type TextureKind } from "./textures";
import type { PageInk, RecordFormat } from "./types";

/** Panel values → what the bake, the stage and Record need. Tolerant of stale stored values. */

export type TextureChoice = { kind: TextureKind | "None"; strength: number };

const texture = (kind: unknown, strength: unknown, fallback: TextureKind | "None"): TextureChoice => ({
  kind: kind === "None" || TEXTURES.includes(kind as TextureKind) ? (kind as TextureKind | "None") : fallback,
  strength: Math.min(2, Math.max(0, Number.isFinite(Number(strength)) ? Number(strength) / 100 : 1)),
});

export type CoverSetup = {
  style: "artwork" | "orbit" | "type" | "full" | "on-color";
  /** "upload", or the feature (0-based) whose intro image goes on the cover */
  source: "upload" | number;
  color: string;
  ink: string;
  /** 0.3–1 of the space the image may take (Image on color) */
  scale: number;
  dots: CoverDots;
};

export type EditorialSetup = {
  on: boolean;
  columns: number;
  textSize: "Small" | "Medium" | "Large";
  imageScale: number;
  ink: PageInk;
};

export type PageSetup = {
  fill: boolean;
  /** 0.3–1 */
  imageScale: number;
  cover: CoverSetup;
  back: PageInk;
  editorial: EditorialSetup;
  texture: TextureChoice;
};

export type StageSetup = { color: string; texture: TextureChoice; grid: boolean };

// "Human + Motion" is the supplied artwork; "Orbit" the dotted cover; "Plain" the first typographic one
const COVER_STYLE = { "Human + Motion": "artwork", Orbit: "orbit", Plain: "type", "Full image": "full", "Image on color": "on-color" } as const;
const HEX = /^#[0-9a-f]{6}$/i;

/** A percent control → 0.3…1. */
const toScale = (p: unknown) => Math.min(1, Math.max(0.3, (Number(p) || 100) / 100));

export function pageSetup(v: Record<string, unknown>): PageSetup {
  const src = /^Feature (\d+)$/.exec(String(v.coverImage));
  const cover: CoverSetup = {
    style: COVER_STYLE[v.coverLayout as keyof typeof COVER_STYLE] ?? "artwork",
    source: src ? Number(src[1]) - 1 : "upload",
    color: HEX.test(String(v.coverBg)) ? String(v.coverBg) : COVER.bg,
    // the cover ink is printed black or white, never a UI color
    ink: v.coverInk === "White" ? "#FFFFFF" : "#0C0C0C",
    scale: toScale(v.coverImageSize),
    dots: {
      on: v.coverDots !== false,
      pattern: DOT_PATTERNS.includes(v.coverDotPattern as DotPattern) ? (v.coverDotPattern as DotPattern) : "Grid",
      size: Math.min(60, Math.max(3, Number(v.coverDotSize) || 12)),
      spacing: Math.min(160, Math.max(10, Number(v.coverDotSpacing) || 32)),
      color: HEX.test(String(v.coverDotColor)) ? String(v.coverDotColor) : "#CC84FC",
    },
  };
  const editorial: EditorialSetup = {
    on: v.editorial !== false,
    columns: Math.min(3, Math.max(1, Number(v.textColumns) || 2)),
    textSize: v.textSize === "Small" || v.textSize === "Large" ? v.textSize : "Medium",
    imageScale: toScale(v.textImageSize),
    ink: pageInk(v.textPage, { bg: "#FFFFFF", ink: "#0C0C0C" }),
  };
  return { fill: v.imageFit === "Fill", imageScale: toScale(v.imageSize), cover, back: backInk(v), editorial, texture: texture(v.pageTexture, v.pageTextureStrength, "Newsprint") };
}

export function stageSetup(v: Record<string, unknown>): StageSetup {
  return { color: HEX.test(String(v.stageColor)) ? String(v.stageColor) : "#EAEAEA", texture: texture(v.stageTexture, v.stageTextureStrength, "Newsprint"), grid: v.stageGrid === true };
}

export function recordFormat(v: Record<string, unknown>): RecordFormat {
  return v.format === "4:5" ? "portrait" : v.format === "9:16" ? "story" : "square";
}
