"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readStorage, removeStorage, storageKey, writeStorage } from "@/lib/storage";

type Store = { value: unknown; listeners: Set<() => void> };
const stores = new Map<string, Store>();

/**
 * A value remembered in localStorage (`playground:<slug>:<key>`), shared by every component
 * that asks for the same key. Server render and hydration use `initial`; storage loads after.
 * `sanitize` turns whatever was stored into a valid value, or undefined to use `initial`.
 */
export function usePersistent<T>(
  slug: string,
  key: string,
  initial: T,
  sanitize: (raw: unknown) => T | undefined,
): [T, (next: T) => void, () => void] {
  const k = storageKey(slug, key);
  const get = useCallback((): Store => {
    let s = stores.get(k);
    if (!s) {
      const raw = readStorage<unknown>(k);
      s = { value: raw === undefined ? initial : (sanitize(raw) ?? initial), listeners: new Set() };
      stores.set(k, s);
    }
    return s;
    // initial/sanitize are module constants in every caller
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  const subscribe = useCallback(
    (cb: () => void) => {
      const s = get();
      s.listeners.add(cb);
      return () => s.listeners.delete(cb);
    },
    [get],
  );
  const value = useSyncExternalStore(subscribe, () => get().value as T, () => initial);
  const set = useCallback(
    (next: T) => {
      const s = get();
      s.value = next;
      writeStorage(k, next);
      s.listeners.forEach((l) => l());
    },
    [get, k],
  );
  const reset = useCallback(() => {
    const s = get();
    s.value = initial;
    removeStorage(k);
    s.listeners.forEach((l) => l());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [get, k]);
  return [value, set, reset];
}

export const asString = (raw: unknown) => (typeof raw === "string" ? raw : undefined);
