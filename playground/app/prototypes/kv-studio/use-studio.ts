"use client";

import { useMemo } from "react";
import { PALETTES, type Composition, type FormatId } from "@/lib/kv/model";
import { adaptTo, presetFor } from "@/lib/kv/presets";
import { autoMix } from "./auto-mix";
import { useStored } from "./store";
import type { Anim, Settings } from "./types";

/** Where the poster comes from: the built-in Motion, Now layout, or a KV Editor JSON. */
export type PosterSource = { kind: "preset" } | { kind: "import"; name: string; comp: Composition };

let n = 0;
export const newId = () => `a${Date.now().toString(36)}${(n++).toString(36)}`;

/** The poster in the chosen format and palette, plus its animation. Call only once fonts are ready. */
export function useStudio(settings: Settings) {
  const [storedSource, setSource] = useStored<PosterSource>("poster");
  const [storedAnim, setAnim] = useStored<Anim>("anim");
  const source = useMemo<PosterSource>(() => storedSource ?? { kind: "preset" }, [storedSource]);
  const format = settings.format as FormatId;

  const base = useMemo(() => {
    if (source.kind === "preset") return presetFor(format);
    return source.comp.format === format ? source.comp : adaptTo(source.comp, format);
  }, [source, format]);

  const comp = useMemo(
    () => (settings.palette === "Poster" ? base : { ...base, palette: { ...PALETTES[settings.palette] } }),
    [base, settings.palette],
  );

  // First visit: a ready-made mix, so the poster already moves.
  const fallback = useMemo<Anim>(() => ({ version: 1, tracks: [], mix: autoMix(base, newId) }), [base]);
  const anim = storedAnim ?? fallback;

  return { comp, anim, setAnim, source, setSource };
}
