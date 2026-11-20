"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readStorage, storageKey, writeStorage } from "@/lib/storage";
import { loadFonts } from "@/lib/kv/fonts";
import { SLUG } from "./data";

type Store<T> = { value: T | null; past: (T | null)[]; future: (T | null)[]; listeners: Set<() => void> };
const stores = new Map<string, Store<unknown>>();
const HISTORY = 100;

function getStore<T>(name: string): Store<T> {
  let s = stores.get(name) as Store<T> | undefined;
  if (!s) {
    s = { value: readStorage<T>(storageKey(SLUG, name)) ?? null, past: [], future: [], listeners: new Set() };
    stores.set(name, s as Store<unknown>);
  }
  return s;
}

const emit = (s: Store<unknown>) => s.listeners.forEach((l) => l());

/**
 * A value remembered in localStorage (`playground:kv-studio:<name>`), with undo. Null until
 * something is stored; the server render and first client render always see null.
 */
export function useStored<T>(name: string) {
  const subscribe = useCallback((cb: () => void) => {
    const s = getStore<T>(name);
    s.listeners.add(cb);
    return () => s.listeners.delete(cb);
  }, [name]);
  const value = useSyncExternalStore(subscribe, () => getStore<T>(name).value, () => null);
  const set = useCallback(
    (next: T | null, history = true) => {
      const s = getStore<T>(name);
      if (history) {
        s.past.push(s.value);
        if (s.past.length > HISTORY) s.past.shift();
        s.future = [];
      }
      s.value = next;
      writeStorage(storageKey(SLUG, name), next);
      emit(s as Store<unknown>);
    },
    [name],
  );
  return [value, set] as const;
}

/** Steps a stored value back (-1) or forward (+1) through its history. */
export function stepHistory(name: string, dir: -1 | 1) {
  const s = getStore<unknown>(name);
  const from = dir < 0 ? s.past : s.future;
  const to = dir < 0 ? s.future : s.past;
  if (!from.length) return;
  to.push(s.value);
  s.value = from.pop()!;
  writeStorage(storageKey(SLUG, name), s.value);
  emit(s);
}

// ---------------------------------------------------------------- fonts

let fontState: "loading" | "ready" | "error" = "loading";
const fontListeners = new Set<() => void>();
let started = false;

function subscribeFonts(cb: () => void) {
  fontListeners.add(cb);
  if (!started) {
    started = true;
    loadFonts().then(
      () => (fontState = "ready"),
      () => (fontState = "error"),
    ).finally(() => fontListeners.forEach((l) => l()));
  }
  return () => fontListeners.delete(cb);
}

/** The KV fonts load once, before the first paint; exports never fall back to a system face. */
export function useFonts() {
  return useSyncExternalStore(subscribeFonts, () => fontState, () => "loading" as const);
}
