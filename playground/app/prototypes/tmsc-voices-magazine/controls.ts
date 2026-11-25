import { defineControls, type ControlValues } from "@/components/controls";
import { coverOption, mediaOptions, resolveMedia, type MediaChoice } from "./media";
import type { RecordFormat } from "./types";

/** How each spread is put together: which image from the post, which frame of it, how it sits. */

const DEFAULT_FRAME = { 1: 1, 2: 3, 3: 3, 4: 1 } as const;

const spread = (order: 1 | 2 | 3 | 4, name: string) =>
  ({
    [`${name}Image`]: { type: "select", label: `${cap(name)} image`, options: mediaOptions(order), default: coverOption(order) },
    [`${name}Frame`]: { type: "number", label: `${cap(name)} frame`, min: 1, max: 6, step: 1, default: DEFAULT_FRAME[order] },
  }) as const;

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const controls = defineControls({
  ...spread(1, "victor"),
  ...spread(2, "thais"),
  ...spread(3, "doug"),
  ...spread(4, "justin"),
  imageFit: { type: "select", label: "Image", options: ["Fit", "Fill"], default: "Fit" },
  format: { type: "select", label: "Export", options: ["1:1", "4:5"], default: "1:1", randomize: false },
});

export type Values = ControlValues<typeof controls>;

export type PageSetup = { media: Record<1 | 2 | 3 | 4, MediaChoice>; fill: boolean };

const NAMES = { 1: "victor", 2: "thais", 3: "doug", 4: "justin" } as const;

export function pageSetup(v: Record<string, unknown>): PageSetup {
  const pick = (order: 1 | 2 | 3 | 4) =>
    resolveMedia(order, String(v[`${NAMES[order]}Image`]), Number(v[`${NAMES[order]}Frame`]));
  return { media: { 1: pick(1), 2: pick(2), 3: pick(3), 4: pick(4) }, fill: v.imageFit === "Fill" };
}

export function recordFormat(v: Record<string, unknown>): RecordFormat {
  return v.format === "4:5" ? "portrait" : "square";
}
