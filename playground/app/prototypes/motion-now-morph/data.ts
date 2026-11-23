import { defineControls } from "@/components/controls";
import { CHAPTER_NAMES } from "@/lib/tmsc/palettes";

export const SLUG = "motion-now-morph";

export const controls = defineControls({
  chapter: { type: "select", label: "Chapter", options: CHAPTER_NAMES, default: "Money" },
  progress: { type: "number", label: "Progress", min: 0, max: 1, step: 0.001, default: 0, randomize: false },
  easing: { type: "select", label: "Easing", options: ["power2", "expo", "back"], default: "expo" },
  stagger: { type: "number", label: "Stagger", min: 0, max: 0.8, step: 0.01, default: 0.35 },
  duration: { type: "number", label: "Duration (s)", min: 1, max: 8, step: 0.1, default: 3.2 },
  format: { type: "select", label: "Format", options: ["16:9 · 1920×1080", "4:5 · 1080×1350"], default: "16:9 · 1920×1080", randomize: false },
});

/** Day-rate bins for "Money", USD. The last bin is open-ended. */
export const RATE_EDGES = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

/** Timeline marks on the 0..1 progress, shared by background, title and labels. */
export const MARKS = {
  wipe: [0.04, 0.5],
  title: [0.2, 0.55],
  labels: [0.78, 0.18],
} as const;

/** Seconds of stillness before and after the morph in a recorded video. */
export const VIDEO_LEAD = 0.5;
export const VIDEO_HOLD = 1.5;
