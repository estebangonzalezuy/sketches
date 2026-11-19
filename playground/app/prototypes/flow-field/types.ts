import type { ControlValues } from "@/components/controls";
import type { controls } from "./data";

export type Settings = ControlValues<typeof controls>;

/** Particles live in a struct-of-arrays for speed: x, y, previous x, previous y, age. */
export type Particles = {
  count: number;
  x: Float32Array;
  y: Float32Array;
  px: Float32Array;
  py: Float32Array;
  age: Uint16Array;
};

export type Size = { width: number; height: number };
