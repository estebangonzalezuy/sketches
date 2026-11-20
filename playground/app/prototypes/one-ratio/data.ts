import { defineControls } from "@/components/controls";
import type { Ease, Track, TrackId } from "./types";

export const SLUG = "one-ratio";

export const controls = defineControls({
  duration: { type: "number", label: "Duration (s)", min: 0.3, max: 6, step: 0.1, default: 1.6 },
  loop: { type: "boolean", label: "Loop", default: false },
  path: { type: "boolean", label: "Path", default: true },
  ghosts: { type: "boolean", label: "Onion skin", default: false },
});

/** The four tracks from the reference: the dot arcs up-right while it fades and pulses. */
export const DEFAULT_TRACKS: Track[] = [
  { id: "x", input: { kind: "window", from: 0.15, to: 0.7 }, ease: "easeInOut", out: [22, 80] },
  { id: "y", input: { kind: "window", from: 0.15, to: 0.85 }, ease: "easeInOut", out: [86, 12] },
  { id: "scale", input: { kind: "envelope", inEnd: 0.25, outStart: 0.75 }, ease: "easeIn", out: [0.9, 1] },
  { id: "opacity", input: { kind: "envelope", inEnd: 0.25, outStart: 0.75 }, ease: "linear", out: [0, 1] },
];

export const TRACK_META: Record<TrackId, { unit: string; decimals: number; step: number }> = {
  x: { unit: "%", decimals: 1, step: 1 },
  y: { unit: "%", decimals: 1, step: 1 },
  scale: { unit: "", decimals: 2, step: 0.05 },
  opacity: { unit: "", decimals: 2, step: 0.05 },
};

export const EASE_OPTIONS: Ease[] = ["linear", "easeIn", "easeOut", "easeInOut"];

/** Onion-skin samples of t. */
/** First frame shown: mid-flight, so the dot is visible before anything is touched. */
export const INITIAL_T = 0.39;

export const GHOST_STEPS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
