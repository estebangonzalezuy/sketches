import type { Content, Pt, RasterContent, Rect, ShapePath } from "../engine/geometry";
import type { Params, ParamSpecs, Value } from "../model/types";

export type ToolCtx = {
  /** seconds on the project clock, and since the layer's in point */
  time: number;
  local: number;
  /** device px per comp px for anything rasterised */
  scale: number;
  width: number;
  height: number;
  /** stable key for caches and GL output slots */
  slot: string;
};

/** Makes a layer's content. Vector generators return contours; raster and GL ones a bitmap. */
export type GeneratorDef = {
  id: string;
  name: string;
  engine: "vector" | "raster" | "gl";
  params: ParamSpecs;
  generate(p: Params, ctx: ToolCtx): Content;
};

/** A point the viewport lets you drag; it reads and writes one vec2 param of the effect. */
export type Handle = {
  param: string;
  /** param value → layer-space point, given the content box before this effect */
  toLayer(v: Value, box: Rect): Pt;
  fromLayer(pt: Pt, box: Rect): Value;
};

/**
 * Changes a layer's content. `vector` bends contours (stays sharp); `raster` works on the
 * bitmap, usually in WebGL. A vector layer meeting a raster-only effect is rasterised first.
 */
export type EffectDef = {
  id: string;
  name: string;
  params: ParamSpecs;
  vector?(paths: ShapePath[], p: Params, ctx: ToolCtx): ShapePath[];
  raster?(c: RasterContent, p: Params, ctx: ToolCtx): RasterContent;
  handles?: Handle[];
};
