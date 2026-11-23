import { defineControls } from "@/components/controls";

export const SLUG = "kinetic-pin";

export const FORMATS = { "4:5": [1080, 1350], "1:1": [1080, 1080], "9:16": [1080, 1920], "16:9": [1920, 1080] } as const;
export type FormatId = keyof typeof FORMATS;

export const controls = defineControls({
  amplitude: { type: "number", label: "Amplitude", min: 0, max: 1, step: 0.01, default: 0.45 },
  loop: { type: "number", label: "Loop (s)", min: 0.5, max: 8, step: 0.1, default: 2 },
  steepness: { type: "number", label: "Ease steepness", min: 0, max: 0.98, step: 0.01, default: 0.8 },
  words: { type: "number", label: "Words", min: 2, max: 8, step: 1, default: 2 },
  phase: { type: "number", label: "Phase offset", min: 0, max: 1, step: 0.01, default: 0 },
  margin: { type: "number", label: "Margin", min: 0, max: 0.3, step: 0.01, default: 0.08 },
  ink: { type: "color", label: "Ink", default: "#f8f6ee" },
  ground: { type: "color", label: "Ground", default: "#141313" },
  format: { type: "select", label: "Format", options: ["4:5", "1:1", "9:16", "16:9"], default: "4:5", randomize: false },
  fps: { type: "select", label: "Export fps", options: ["60", "30"], default: "60", randomize: false },
  loops: { type: "number", label: "Export loops", min: 1, max: 10, step: 1, default: 3, randomize: false },
});

/** Glyph size the word textures are rasterised at (px); quads sample them with mipmaps. */
export const TEXTURE_SIZE = 600;
