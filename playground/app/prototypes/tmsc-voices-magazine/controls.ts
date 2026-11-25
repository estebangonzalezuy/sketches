import { defineControls, type ControlValues } from "@/components/controls";
import { BACK_COVER, COVER, SPREADS } from "./data";
import { coverOption, mediaOptions, resolveMedia, type MediaChoice } from "./media";
import { pageInks, type PageInks } from "./page-inks";
import type { RecordFormat } from "./types";

/** How each spread is put together: which image from the post, which frame of it, how it sits. */

const DEFAULT_FRAME = { 1: 1, 2: 3, 3: 3, 4: 1 } as const;

const spread = (order: 1 | 2 | 3 | 4, name: string) =>
  ({
    [`${name}Image`]: { type: "select", label: `${cap(name)} image`, options: mediaOptions(order), default: coverOption(order) },
    [`${name}Frame`]: { type: "number", label: `${cap(name)} frame`, min: 1, max: 6, step: 1, default: DEFAULT_FRAME[order] },
    [`${name}Left`]: { type: "color", label: `${cap(name)} left page`, default: SPREADS[order].left.bg },
    [`${name}Right`]: { type: "color", label: `${cap(name)} right page`, default: SPREADS[order].right.bg },
  }) as const;

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const controls = defineControls({
  ...spread(1, "victor"),
  ...spread(2, "thais"),
  ...spread(3, "doug"),
  ...spread(4, "justin"),
  imageFit: { type: "select", label: "Image", options: ["Fit", "Fill"], default: "Fit" },
  imageSize: { type: "number", label: "Image size %", min: 30, max: 100, step: 5, default: 100 },
  coverStyle: { type: "select", label: "Cover", options: ["Type", "Full image", "Image on color"], default: "Type" },
  coverImage: { type: "select", label: "Cover image", options: ["Uploaded", "Victor", "Thais", "Doug", "Justin"], default: "Uploaded" },
  coverBg: { type: "color", label: "Cover color", default: COVER.bg },
  coverImageSize: { type: "number", label: "Cover image size %", min: 30, max: 100, step: 5, default: 100 },
  coverInk: { type: "select", label: "Cover type", options: ["Black", "White"], default: "Black" },
  backColor: { type: "color", label: "Back cover color", default: BACK_COVER.bg },
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

export type PageSetup = { media: Record<1 | 2 | 3 | 4, MediaChoice>; fill: boolean; /** 0.3–1 */ imageScale: number; cover: CoverSetup; inks: PageInks };

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
  return { media: { 1: pick(1), 2: pick(2), 3: pick(3), 4: pick(4) }, fill: v.imageFit === "Fill", imageScale: toScale(v.imageSize), cover, inks: pageInks(v) };
}

export function recordFormat(v: Record<string, unknown>): RecordFormat {
  return v.format === "4:5" ? "portrait" : "square";
}
