import { defineControls } from "@/components/controls";
import { FORMATS, PALETTES, type FormatId } from "@/lib/kv/model";
import type { BehaviorKind, Dir, EaseName, Prop } from "./types";

export const SLUG = "kv-studio";

export const FORMAT_IDS = Object.keys(FORMATS) as FormatId[];
/** "Poster" keeps the palette the poster came with. */
export const PALETTE_NAMES = ["Poster", ...Object.keys(PALETTES)] as const;

export const controls = defineControls({
  palette: { type: "select", label: "Palette", options: PALETTE_NAMES, default: "Poster" },
  duration: { type: "number", label: "Length (s)", min: 2, max: 20, step: 0.5, default: 6, randomize: false },
  fps: { type: "select", label: "Frame rate", options: ["12", "24", "30", "60"], default: "30", randomize: false },
  loop: { type: "boolean", label: "Loop", default: true, randomize: false },
});

export const BEHAVIORS: Record<BehaviorKind, { label: string; dir: boolean }> = {
  fade: { label: "Fade", dir: false },
  slide: { label: "Slide", dir: true },
  wipe: { label: "Wipe", dir: true },
  grow: { label: "Grow", dir: false },
  spin: { label: "Spin", dir: true },
  pixel: { label: "Pixel build", dir: false },
  drift: { label: "Drift", dir: true },
};
export const BEHAVIOR_KINDS = Object.keys(BEHAVIORS) as BehaviorKind[];
export const DIRS: Dir[] = ["up", "down", "left", "right"];

/** Keyframe channels: label and the slider range of a key's value. */
export const PROPS: Record<Prop, { label: string; min: number; max: number; step: number }> = {
  dx: { label: "Move X", min: -1920, max: 1920, step: 1 },
  dy: { label: "Move Y", min: -1920, max: 1920, step: 1 },
  scale: { label: "Scale", min: 0, max: 3, step: 0.01 },
  rotate: { label: "Rotate", min: -720, max: 720, step: 1 },
  alpha: { label: "Opacity", min: 0, max: 1, step: 0.01 },
  pixel: { label: "Pixel cell", min: 0, max: 120, step: 1 },
  reveal: { label: "Reveal", min: 0, max: 1, step: 0.01 },
};
export const PROP_IDS = Object.keys(PROPS) as Prop[];

export const EASE_NAMES: EaseName[] = ["out", "in-out", "in", "linear", "hold"];

export const LAYER_TYPE_LABEL: Record<string, string> = {
  block: "Block",
  bracket: "Bracket",
  grid: "Grid",
  headline: "Headline",
  text: "Text",
  shape: "Shape",
  lockup: "Lockup",
  image: "Image",
};
