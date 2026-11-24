"use client";

import { useMemo, useSyncExternalStore } from "react";
import { loadFonts } from "@/lib/kv/fonts";
import { readStorage, storageKey, writeStorage } from "@/lib/storage";
import { SLUG } from "./data";
import { headlineBox } from "./draw-type";
import { generate, type GenOptions } from "./generate";
import type { Ease } from "@/lib/studio/model/types";
import type { Poster } from "./types";

/** Edits are tied to the generator settings they were made on; new settings → a fresh poster. */
type Saved = { key: string; poster: Poster };
const KEY = storageKey(SLUG, "poster");
const listeners = new Set<() => void>();
let saved: Saved | null | undefined;
const past: Saved[] = [];
const future: Saved[] = [];

const read = () => (saved === undefined ? (saved = readStorage<Saved>(KEY) ?? null) : saved);
const emit = () => listeners.forEach((l) => l());
function set(next: Saved | null) {
  saved = next;
  writeStorage(KEY, next);
  emit();
}
const subscribe = (cb: () => void) => (listeners.add(cb), () => listeners.delete(cb));

export const genKey = (o: GenOptions) => JSON.stringify([o.template, o.seed, o.format, o.density, o.paint]);

/** The poster for these settings: the saved edit if it belongs to them, else a generated one. */
export function usePoster(o: GenOptions): Poster {
  const s = useSyncExternalStore(subscribe, read, () => null);
  const { template, seed, format, density, paint } = o;
  const fresh = useMemo(() => generate({ template, seed, format, density, paint }, headlineBox), [template, seed, format, density, paint]);
  return s && s.key === genKey(o) ? migrate(s.poster) : fresh;
}

let last: { group: string; at: number } | null = null;

/** Apply an edit. Edits with the same `group` within 600 ms share one undo step (a slider drag). */
/** Older saves: drop removed element kinds, fill in new fields. */
function migrate(p: Poster): Poster {
  return { ...p, paint: p.paint ?? "fills", elements: p.elements.filter((e) => KINDS.has(e.kind)) };
}
const KINDS = new Set(["block", "bands", "flower", "spiral", "headline", "lockup", "mark"]);

export function editPoster(o: GenOptions, current: Poster, fn: (p: Poster) => Poster, group?: string) {
  const key = genKey(o);
  const now = Date.now();
  const merge = group && last && last.group === group && now - last.at < 600;
  last = group ? { group, at: now } : null;
  if (!merge) {
    past.push(read()?.key === key ? read()! : { key, poster: current });
    if (past.length > 100) past.shift();
  }
  future.length = 0;
  set({ key, poster: fn(current) });
}

export function undo() {
  const prev = past.pop();
  if (!prev) return;
  if (read()) future.push(read()!);
  set(prev);
}
export function redo() {
  const next = future.pop();
  if (!next) return;
  if (read()) past.push(read()!);
  set(next);
}
export const canUndo = () => past.length > 0;
export const canRedo = () => future.length > 0;

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

// ---------------------------------------------------------------- animation curve

const EASE_KEY = storageKey(SLUG, "ease");
const easeListeners = new Set<() => void>();
let easeValue: Ease | undefined;
const readEase = (): Ease => (easeValue ??= readStorage<Ease>(EASE_KEY) ?? "out");
export const useEase = () =>
  useSyncExternalStore(
    (cb) => (easeListeners.add(cb), () => easeListeners.delete(cb)),
    readEase,
    () => "out" as Ease,
  );
export function setEase(e: Ease) {
  easeValue = e;
  writeStorage(EASE_KEY, e);
  easeListeners.forEach((l) => l());
}
