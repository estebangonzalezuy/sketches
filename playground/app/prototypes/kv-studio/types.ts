import type { ControlValues } from "@/components/controls";
import type { controls } from "./data";

export type Settings = ControlValues<typeof controls>;

export type EaseName = "out" | "in-out" | "in" | "linear" | "hold";

/** Animatable channels. All are offsets from the resting poster, so no key = the static KV. */
export type Prop = "dx" | "dy" | "scale" | "rotate" | "alpha" | "pixel" | "reveal";

export type Key = { id: string; t: number; v: number; ease: EaseName };

/** Keyframes for one channel of one layer. `layer` is the layer's role (or id), so a track survives format changes. */
export type Track = { layer: string; prop: Prop; keys: Key[] };

export type BehaviorKind = "fade" | "slide" | "wipe" | "grow" | "spin" | "pixel" | "drift";
export type Dir = "up" | "down" | "left" | "right";

/** One behavior in the mix: it runs inside [start, end] of the Progress slider (0–1). */
export type Behavior = {
  id: string;
  layer: string;
  kind: BehaviorKind;
  dir: Dir;
  amount: number;
  start: number;
  end: number;
};

export type Anim = { version: 1; tracks: Track[]; mix: Behavior[] };

/** What the stage needs to size a behavior: the poster and the layer's resting box. */
export type Box = { x: number; y: number; w: number; h: number };
