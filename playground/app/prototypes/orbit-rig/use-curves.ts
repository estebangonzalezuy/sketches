"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readStorage, storageKey, writeStorage } from "@/lib/storage";
import { sanitizeKeys } from "./curve";
import { CURVE_META, DEFAULT_CURVES, SLUG } from "./data";
import type { CurveId, Curves, Key } from "./types";

const KEY = storageKey(SLUG, "curves");
let current: Curves | null = null;
const listeners = new Set<() => void>();

function load(): Curves {
  const raw = (readStorage<Record<string, unknown>>(KEY) ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_CURVES };
  for (const m of CURVE_META) out[m.id] = sanitizeKeys(raw[m.id], DEFAULT_CURVES[m.id], m.min, m.max);
  return out;
}

const get = () => (current ??= load());

function commit(next: Curves) {
  current = next;
  writeStorage(KEY, next);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Editable squash curves, remembered in localStorage. Server render uses the defaults. */
export function useCurves() {
  const curves = useSyncExternalStore(subscribe, get, () => DEFAULT_CURVES);
  const setCurve = useCallback((id: CurveId, keys: Key[]) => commit({ ...get(), [id]: keys }), []);
  const resetCurve = useCallback(
    (id: CurveId) => commit({ ...get(), [id]: DEFAULT_CURVES[id] }),
    [],
  );
  return { curves, setCurve, resetCurve };
}
