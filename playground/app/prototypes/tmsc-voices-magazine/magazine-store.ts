"use client";

import { useSyncExternalStore } from "react";
import { readStorage, storageKey, writeStorage } from "@/lib/storage";
import { SLUG } from "./data";
import { DEFAULT_MAGAZINE, sanitizeMagazine, type Magazine } from "./feature";

/** The magazine being edited (its features, in order), remembered in this browser. */

const KEY = storageKey(SLUG, "magazine");
const listeners = new Set<() => void>();
let cache: Magazine | null = null;

function snapshot(): Magazine {
  cache ??= sanitizeMagazine(readStorage(KEY)) ?? DEFAULT_MAGAZINE;
  return cache;
}

export function useMagazine(): Magazine {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    snapshot,
    () => DEFAULT_MAGAZINE,
  );
}

export function setMagazine(m: Magazine) {
  cache = m;
  writeStorage(KEY, m);
  listeners.forEach((l) => l());
}
