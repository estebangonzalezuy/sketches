import { defineControls } from "@/components/controls";

export const SLUG = "flow-field";

export const controls = defineControls({
  count: { type: "number", label: "Particles", min: 100, max: 4000, step: 100, default: 1500 },
  speed: { type: "number", label: "Speed", min: 0.2, max: 4, step: 0.1, default: 1.2 },
  scale: { type: "number", label: "Scale", min: 0.5, max: 8, step: 0.1, default: 2.5 },
  drift: { type: "number", label: "Drift", min: 0, max: 1, step: 0.05, default: 0.2 },
  fade: { type: "number", label: "Trail", min: 0, max: 0.98, step: 0.01, default: 0.92 },
  width: { type: "number", label: "Line width", min: 0.5, max: 3, step: 0.1, default: 1 },
  ink: { type: "select", label: "Ink", options: ["theme", "tint"], default: "theme" },
  tint: { type: "color", label: "Tint", default: "#6d8cff" },
});

/** A particle respawns at a random spot after this many frames, so the field keeps filling. */
export const MAX_AGE = 240;

/** Frames simulated at once for the still image shown under prefers-reduced-motion. */
export const STILL_FRAMES = 160;
