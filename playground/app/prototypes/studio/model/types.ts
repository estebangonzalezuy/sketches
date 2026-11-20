/** A parameter value. vec2 is [x, y]; colors are #rrggbb. */
export type Value = number | [number, number] | string | boolean;

export type EaseName = "linear" | "ease" | "in" | "out" | "hold";

/** A keyframe. `t` is seconds on the project clock; the ease shapes the segment that leaves it. */
export type Key = { id: string; t: number; v: Value; ease: EaseName };

/** A parameter is either a fixed value or animated by keys (the stopwatch is on). */
export type Track = { value: Value } | { keys: Key[] };

export type ParamSpec =
  | { kind: "number"; label: string; default: number; min: number; max: number; step?: number; unit?: string; display?: number }
  | { kind: "vec2"; label: string; default: [number, number]; step?: number }
  | { kind: "color"; label: string; default: string }
  | { kind: "select"; label: string; default: string; options: readonly { value: string; label: string }[] }
  | { kind: "text"; label: string; default: string }
  | { kind: "boolean"; label: string; default: boolean };

/** hidden: data the tool needs (a KV layer, a polygon) that is neither shown nor animated. */
export type Spec = ParamSpec & { hidden?: boolean };
export type ParamSpecs = Record<string, Spec>;
export type Params = Record<string, Value>;

export type Blend = "source-over" | "multiply" | "screen" | "overlay" | "difference";

/** Where a layer sits and how it's composited. Values are layer-space → comp-space (AE order). */
export type TransformTracks = { position: Track; anchor: Track; scale: Track; rotation: Track; opacity: Track };

export type EffectInstance = { id: string; tool: string; enabled: boolean; params: Record<string, Track> };

export type Layer = {
  id: string;
  name: string;
  /** generator tool id */
  tool: string;
  visible: boolean;
  /** seconds on the project clock */
  inPoint: number;
  outPoint: number;
  blend: Blend;
  transform: TransformTracks;
  params: Record<string, Track>;
  effects: EffectInstance[];
};

export type Project = {
  version: 1;
  name: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  background: string;
  /** back → front */
  layers: Layer[];
};

/** Something on the timeline that holds a track: a transform channel, a generator param or an effect param. */
export type ParamPath =
  | { layer: string; group: "transform"; param: keyof TransformTracks }
  | { layer: string; group: "params"; param: string }
  | { layer: string; group: "effect"; effect: string; param: string };
