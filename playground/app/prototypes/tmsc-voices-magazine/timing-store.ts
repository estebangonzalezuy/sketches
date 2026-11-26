"use client";

import { useSyncExternalStore } from "react";
import { readStorage, storageKey, writeStorage } from "@/lib/storage";
import { SLUG } from "./data";
import type { Overrides } from "./timing";

/** Per-segment timing edits from the timeline, remembered in this browser. */

const KEY = storageKey(SLUG, "timing-overrides");
const EMPTY: Overrides = {};
const listeners = new Set<() => void>();
let cache: Overrides | null = null;

function snapshot(): Overrides {
  cache ??= readStorage<Overrides>(KEY) ?? EMPTY;
  return cache;
}

export function useOverrides(): Overrides {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    snapshot,
    () => EMPTY,
  );
}

export function setOverrides(o: Overrides) {
  cache = o;
  writeStorage(KEY, o);
  listeners.forEach((l) => l());
}
