import type { ParamSpecs } from "./types";

/** The layer transform, shown and edited like any tool param. Scale and opacity display as %. */
export const TRANSFORM_SPECS: ParamSpecs = {
  anchor: { kind: "vec2", label: "Anchor point", default: [0, 0], step: 1 },
  position: { kind: "vec2", label: "Position", default: [960, 540], step: 1 },
  scale: { kind: "number", label: "Scale", default: 1, min: -10, max: 10, step: 0.01, unit: "%", display: 100 },
  rotation: { kind: "number", label: "Rotation", default: 0, min: -3600, max: 3600, step: 1, unit: "°" },
  opacity: { kind: "number", label: "Opacity", default: 1, min: 0, max: 1, step: 0.01, unit: "%", display: 100 },
};
