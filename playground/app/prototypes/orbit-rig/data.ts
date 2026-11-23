import { defineControls } from "@/components/controls";
import type { CurveMeta, Curves } from "./types";

export const SLUG = "orbit-rig";

/** Panel order follows the reference rig: debug toggles first, then timing, then geometry. */
export const controls = defineControls({
  debugSphere: { type: "boolean", label: "Debug sphere", default: true },
  paths: { type: "boolean", label: "Paths", default: false },
  hideFront: { type: "boolean", label: "Hide front card", default: false },
  duration: { type: "number", label: "Duration (s)", min: 0.4, max: 4, step: 0.1, default: 1.4 },
  orbDelay: { type: "number", label: "Orb delay", min: 0, max: 0.1, step: 0.005, default: 0.03 },
  spin: { type: "number", label: "Spin (°/s)", min: 0, max: 90, step: 1, default: 14 },
  mainRotate: { type: "number", label: "Main rotate", min: 0, max: 360, step: 1, default: 20 },
  mainX: { type: "number", label: "Main X offset", min: -200, max: 200, step: 1, default: 0 },
  mainZ: { type: "number", label: "Main Z offset", min: -400, max: 200, step: 1, default: 0 },
  orbSize: { type: "number", label: "Orb size", min: 80, max: 380, step: 1, default: 230 },
  orbZ: { type: "number", label: "Orb Z offset", min: -600, max: 200, step: 1, default: -120 },
  orbCardScale: { type: "number", label: "Orb cards size", min: 0.3, max: 2, step: 0.05, default: 0.7 },
  slice: { type: "number", label: "Slice", min: 0.1, max: 1, step: 0.01, default: 0.9 },
  cards: { type: "number", label: "Cards", min: 3, max: 14, step: 1, default: 9, randomize: false },
  tint: { type: "color", label: "Tint", default: "#a78bfa" },
});

export const CURVE_META: CurveMeta[] = [
  { id: "xSquash", label: "X squash", min: 0, max: 2.5 },
  { id: "ySquash", label: "Y squash", min: 0, max: 2.5 },
  { id: "zSquash", label: "Z squash", min: 0, max: 2.5 },
];

/** Squash over t: the orb opens wide and flat, then settles round. */
export const DEFAULT_CURVES: Curves = {
  xSquash: [{ t: 0, v: 1.8 }, { t: 1, v: 1 }],
  ySquash: [{ t: 0, v: 0.3 }, { t: 0.6, v: 1.1 }, { t: 1, v: 1 }],
  zSquash: [{ t: 0, v: 1 }, { t: 1, v: 1.15 }],
};

/** Stage width in world units; the scene scales to fit the real width. */
export const STAGE_WORLD_WIDTH = 760;
export const CARD_W = 120;
export const CARD_H = 152;

/** First frame shown: mid-flight, so the rig reads before anything is touched. */
export const INITIAL_T = 0.62;
