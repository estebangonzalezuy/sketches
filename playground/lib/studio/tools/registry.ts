import { cornerPin, lettersFx, pixel, radial } from "./effects-shape";
import { shaderField, wave } from "./gl-tools";
import { kvLayer, kvPaper } from "./kv";
import { MB_EFFECTS, MB_GENERATORS } from "./mb";
import { polygon, rect } from "./shapes";
import { text } from "./text";
import type { EffectDef, GeneratorDef } from "./types";

/** Every tool in the studio. A new tool is one file plus one line here. */
export const GENERATORS: Record<string, GeneratorDef> = Object.fromEntries(
  [text, rect, polygon, shaderField, kvLayer, kvPaper, ...MB_GENERATORS].map((g) => [g.id, g]),
);
export const EFFECTS: Record<string, EffectDef> = Object.fromEntries([cornerPin, pixel, radial, lettersFx, wave, ...MB_EFFECTS].map((e) => [e.id, e]));

/** Generators you can add from the UI (the KV ones arrive with a poster). */
export const ADDABLE_GENERATORS = [text, rect, shaderField];
