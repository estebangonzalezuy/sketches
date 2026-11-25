import { defineControls } from "@/components/controls";
import type { Element, FormatId, Kind, Palette } from "./types";

export const SLUG = "kv-posters";

export const FORMATS: Record<FormatId, { label: string; width: number; height: number }> = {
  "3x4": { label: "3:4", width: 1080, height: 1440 },
  "4x5": { label: "4:5", width: 1080, height: 1350 },
  "9x16": { label: "9:16", width: 1080, height: 1920 },
  "1x1": { label: "1:1", width: 1080, height: 1080 },
};

/** Sampled from the reference posters. */
export const PALETTES: Record<string, Palette> = {
  Pastel: {
    paper: "#F7F0DA", ink: "#141313", blue: "#A6C3EE", pink: "#F3A9CF", lilac: "#CDA8EC", mint: "#A9D9A6",
    green: "#2D6B33", orange: "#F2883B", yellow: "#F7E37C", brown: "#5B3A22", cream: "#FBF5E3",
  },
  "KV yellow": {
    paper: "#F5E85A", ink: "#141313", blue: "#BFA1EF", pink: "#FB81BC", lilac: "#BFA1EF", mint: "#FB81BC",
    green: "#064517", orange: "#FB81BC", yellow: "#FEFEFD", brown: "#3D2A14", cream: "#FEFEFD",
  },
  Night: {
    paper: "#151514", ink: "#F7F0DA", blue: "#3F5E92", pink: "#B5527F", lilac: "#7B5AA6", mint: "#4F8A57",
    green: "#2D6B33", orange: "#D46A22", yellow: "#C9B347", brown: "#7A5233", cream: "#1F1F1D",
  },
};

export const TEMPLATES = ["auto", "free", "stack", "cascade", "overlap", "vertical", "line"] as const;

export const controls = defineControls({
  template: { type: "select", label: "Layout", options: TEMPLATES, default: "auto" },
  seed: { type: "number", label: "Seed", min: 1, max: 9999, step: 1, default: 12 },
  format: { type: "select", label: "Format", options: ["3x4", "4x5", "9x16", "1x1"], default: "3x4", randomize: false },
  palette: { type: "select", label: "Palette", options: ["Pastel", "KV yellow", "Night"], default: "Pastel" },
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
