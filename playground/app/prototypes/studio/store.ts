"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readStorage, storageKey, writeStorage } from "@/lib/storage";
import { loadFonts } from "@/lib/kv/fonts";
import { SLUG } from "./data";
import type { Project } from "./model/types";

/**
 * The project, with undo. Edits during a drag pass `history: false` after the first one, so a
 * drag is one undo step. Saved to localStorage (`playground:studio:project`) a moment after edits.
 */
type Store = { value: Project | null; past: Project[]; future: Project[]; listeners: Set<() => void>; timer: number };
const KEY = storageKey(SLUG, "project");
const HISTORY = 150;
let store: Store | null = null;

function get(): Store {
  return (store ??= { value: readStorage<Project>(KEY) ?? null, past: [], future: [], listeners: new Set(), timer: 0 });
}
const emit = () => get().listeners.forEach((l) => l());
function persist() {
  const s = get();
  clearTimeout(s.timer);
  s.timer = window.setTimeout(() => writeStorage(KEY, s.value), 400);
}

export function setProject(next: Project, history = true) {
  const s = get();
  if (history && s.value) {
    s.past.push(s.value);
    if (s.past.length > HISTORY) s.past.shift();
    s.future = [];
  }
  s.value = next;
  persist();
  emit();
}

export const currentProject = () => get().value;

export function undo(dir: -1 | 1 = -1) {
  const s = get();
  const from = dir < 0 ? s.past : s.future;
  const to = dir < 0 ? s.future : s.past;
  if (!from.length || !s.value) return;
  to.push(s.value);
  s.value = from.pop()!;
  persist();
  emit();
}

export function useProject() {
  const subscribe = useCallback((cb: () => void) => {
    get().listeners.add(cb);
    return () => get().listeners.delete(cb);
  }, []);
  return useSyncExternalStore(subscribe, () => get().value, () => null);
}

// ---------------------------------------------------------------- fonts

let fontState: "loading" | "ready" | "error" = "loading";
const fontListeners = new Set<() => void>();
let started = false;
function subscribeFonts(cb: () => void) {
  fontListeners.add(cb);
  if (!started) {
    started = true;
    loadFonts()
      .then(() => (fontState = "ready"), () => (fontState = "error"))
      .finally(() => fontListeners.forEach((l) => l()));
  }
  return () => fontListeners.delete(cb);
}
export const useFonts = () => useSyncExternalStore(subscribeFonts, () => fontState, () => "loading" as const);
