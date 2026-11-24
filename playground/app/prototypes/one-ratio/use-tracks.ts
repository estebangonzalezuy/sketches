"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readStorage, removeStorage, storageKey, writeStorage } from "@/lib/storage";
import { DEFAULT_TRACKS, SLUG } from "./data";
import { sanitizeTracks } from "./sanitize";
import type { Track } from "./types";

const KEY = storageKey(SLUG, "tracks");
let current: Track[] | null = null;
const listeners = new Set<() => void>();

function get(): Track[] {
  current ??= sanitizeTracks(readStorage(KEY), DEFAULT_TRACKS);
  return current;
}

function commit(next: Track[], persist: boolean) {
  current = next;
  if (persist) writeStorage(KEY, next);
  else removeStorage(KEY);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Edited tracks, remembered in localStorage. Server render uses the defaults. */
export function useTracks() {
  const tracks = useSyncExternalStore(subscribe, get, () => DEFAULT_TRACKS);
  const update = useCallback(
    (next: Track) => commit(get().map((t) => (t.id === next.id ? next : t)), true),
    [],
  );
  const reset = useCallback(() => commit(DEFAULT_TRACKS, false), []);
  return { tracks, update, reset };
}
