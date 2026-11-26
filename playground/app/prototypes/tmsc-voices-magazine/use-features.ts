"use client";

import { useMemo } from "react";
import type { Magazine } from "./feature";
import { resolveFeature, type FeatureData } from "./feature-data";
import { postEntry, usePosts } from "./post-client";

/**
 * The magazine's features with their posts filled in. `features` is null until every post has
 * arrived (so pages are baked once, complete); `byId` fills in as each one lands.
 */
export function useFeatures(magazine: Magazine) {
  const version = usePosts(magazine.features.map((f) => f.slug));
  return useMemo(() => {
    const byId: Record<string, FeatureData | null> = {};
    const ready: FeatureData[] = [];
    const errors: string[] = [];
    let pending = false;
    magazine.features.forEach((f, i) => {
      const e = postEntry(f.slug);
      if (e.status === "ready") {
        byId[f.id] = resolveFeature(f, e.post, i);
        ready.push(byId[f.id]!);
      } else {
        byId[f.id] = null;
        if (e.status === "loading") pending = true;
        else errors.push(`${f.slug}: ${e.error}`);
      }
    });
    void version; // re-resolve whenever a post arrives
    return { byId, features: pending ? null : ready, errors };
  }, [magazine, version]);
}
