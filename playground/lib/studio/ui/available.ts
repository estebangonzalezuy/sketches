import { environmentOf } from "../model/environments";
import { TEMPLATES, MB_TEMPLATES, STUDIO_TEMPLATES } from "../model/templates";
import type { Layer, Project } from "../model/types";
import { ADDABLE_GENERATORS, EFFECTS, GENERATORS } from "../tools/registry";

/** What the project's environment offers: addable generators, effects and templates for a layer. */
export function available(p: Project) {
  const env = environmentOf(p);
  const gens = env.generators.length ? env.generators.map((id) => GENERATORS[id]).filter(Boolean) : [...ADDABLE_GENERATORS, ...Object.values(GENERATORS).filter((g) => g.id.startsWith("mb:"))];
  const effects = env.effects === "all" ? Object.values(EFFECTS) : env.effects.map((id) => EFFECTS[id]).filter(Boolean);
  const pool = Array.isArray(env.templates)
    ? env.templates.map((id) => TEMPLATES[id]).filter(Boolean)
    : env.templates === "studio"
      ? STUDIO_TEMPLATES
      : env.templates === "mb"
        ? MB_TEMPLATES
        : Object.values(TEMPLATES);
  return { env, gens, effects, templatesFor: (l: Layer) => pool.filter((t) => t.fits(l)) };
}
