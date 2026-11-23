import { EFFECTS, GENERATORS } from "../tools/registry";
import { TRANSFORM_SPECS } from "./transform-specs";
import type { Layer, ParamPath, Spec } from "./types";

/** The spec (label, kind, range) behind any track on the timeline. */
export function specOf(l: Layer, p: ParamPath): Spec | undefined {
  if (p.group === "transform") return TRANSFORM_SPECS[p.param];
  if (p.group === "params") return GENERATORS[l.tool]?.params[p.param];
  const e = l.effects.find((x) => x.id === p.effect);
  return e ? EFFECTS[e.tool]?.params[p.param] : undefined;
}
