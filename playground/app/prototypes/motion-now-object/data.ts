import { defineControls } from "@/components/controls";
import { PALETTE_NAMES } from "@/lib/tmsc/palettes";
import { ROLES } from "@/lib/tmsc/survey";

export const SLUG = "motion-now-object";

export const controls = defineControls({
  speed: { type: "number", label: "Rotation speed (turns per 6 s)", min: 0, max: 3, step: 0.1, default: 1 },
  orbit: { type: "number", label: "Orbit radius", min: 0.8, max: 1.5, step: 0.01, default: 1.12 },
  palette: { type: "select", label: "Palette", options: PALETTE_NAMES, default: "Acid on ink" },
  format: { type: "select", label: "Format", options: ["4:5 · 1080×1350", "16:9 · 1920×1080"], default: "4:5 · 1080×1350", randomize: false },
});

/** Favorite easings, each with the cubic-bezier it stands for. */
export const EASINGS = {
  "power3.inOut": [0.65, 0, 0.35, 1],
  "expo.out": [0.16, 1, 0.3, 1],
  "back.out": [0.34, 1.56, 0.64, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
  "cubic-bezier(.7,0,.3,1)": [0.7, 0, 0.3, 1],
  linear: [0, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;
export type EasingName = keyof typeof EASINGS;

export type Answers = { handle: string; role: (typeof ROLES)[number]; years: string; easing: EasingName };

export const DEFAULT_ANSWERS: Answers = { handle: "@keyframe.kid", role: "Motion designer", years: "8", easing: "cubic-bezier(.7,0,.3,1)" };

/** Length of one seamless loop, seconds. */
export const LOOP = 6;
