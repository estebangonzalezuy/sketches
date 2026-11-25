import { defineControls } from "@/components/controls";
import { MONO_COLORS, PAIR_PALETTES } from "./palettes";
import type { Element, FormatId, Kind, Palette } from "./types";

export const SLUG = "kv-posters";

export const FORMATS: Record<FormatId, { label: string; width: number; height: number }> = {
  "3x4": { label: "3:4", width: 1080, height: 1440 },
  "4x5": { label: "4:5", width: 1080, height: 1350 },
  "9x16": { label: "9:16", width: 1080, height: 1920 },
  "1x1": { label: "1:1", width: 1080, height: 1080 },
};

/** White canvas, tMSC colours; one figure colour per palette. */
export const PALETTES: Record<string, Palette> = PAIR_PALETTES;

export const TEMPLATES = ["auto", "free", "stack", "cascade", "overlap", "vertical", "line"] as const;

export const controls = defineControls({
  template: { type: "select", label: "Layout", options: TEMPLATES, default: "auto" },
  seed: { type: "number", label: "Seed", min: 1, max: 9999, step: 1, default: 12 },
  format: { type: "select", label: "Format", options: ["3x4", "4x5", "9x16", "1x1"], default: "3x4", randomize: false },
  palette: { type: "select", label: "Palette", options: Object.keys(PALETTES), default: "Blanco / Ink" },
  mono: { type: "select", label: "Mono", options: ["off", ...MONO_COLORS], default: "off" },
  color: { type: "select", label: "Colour", options: ["squares", "fills"], default: "squares" },
  density: { type: "number", label: "Blocks", min: 0, max: 1, step: 0.05, default: 0.55 },
  paper: { type: "boolean", label: "Paper texture", default: true },
  grain: { type: "number", label: "Grain", min: 0, max: 1, step: 0.05, default: 0.4 },
  style: { type: "select", label: "Animation", options: ["build", "loop", "build + loop", "in + out", "construct"], default: "build + loop" },
  notes: { type: "select", label: "Construct notes", options: ["questions", "specs", "off"], default: "questions" },
  duration: { type: "number", label: "Length (s)", min: 2, max: 20, step: 0.5, default: 6 },
  stagger: { type: "number", label: "Stagger", min: 0, max: 1, step: 0.05, default: 0.5 },
  turns: { type: "number", label: "Spin", min: 0, max: 4, step: 1, default: 1 },
  fps: { type: "select", label: "Frame rate", options: ["12", "24", "30", "60"], default: "30", randomize: false },
});

export const PASTELS = ["blue", "pink", "lilac", "mint", "orange", "yellow"] as const;

export const NAMES: Record<Kind, string> = { block: "Block", bands: "Frames", flower: "Flower", spiral: "Spiral", headline: "Headline", lockup: "Lockup", mark: "Asterisk" };

/** A readable row name: the headline's words, or the kind and its number. */
export function elementName(els: Element[], e: Element): string {
  if (e.kind === "headline" || e.kind === "lockup") return e.text.replace(/\n/g, " ");
  const same = els.filter((x) => x.kind === e.kind);
  return same.length > 1 ? `${NAMES[e.kind]} ${same.indexOf(e) + 1}` : NAMES[e.kind];
}
