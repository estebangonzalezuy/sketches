"use client";

import { useSyncExternalStore } from "react";
import { readStorage, storageKey, writeStorage } from "@/lib/storage";
import { loadFonts } from "@/lib/kv/fonts";
import { SLUG } from "./data";
import type { Project } from "./model/types";

/**
 * The workspace: one tab per open project, as in Motion Builder. Each tab keeps its own undo
 * history. Edits during a drag pass `history: false` after the first one, so a drag is one
 * undo step. Saved to localStorage (`playground:studio:workspace`) a moment after edits.
 */
type Tab = { id: string; project: Project; past: Project[]; future: Project[] };
type Workspace = { tabs: Tab[]; active: string; listeners: Set<() => void>; timer: number; snapshot: TabsView | null };
export type TabsView = { tabs: { id: string; name: string; environment: string }[]; active: string };

const KEY = storageKey(SLUG, "workspace");
const OLD = storageKey(SLUG, "project");
const HISTORY = 150;
let ws: Workspace | null = null;
let n = 0;
const tabId = () => `t${Date.now().toString(36)}${(n++).toString(36)}`;

function get(): Workspace {
  if (ws) return ws;
  const saved = readStorage<{ tabs: { id: string; project: Project }[]; active: string }>(KEY);
  const old = readStorage<Project>(OLD);
  const tabs: Tab[] = saved?.tabs?.length ? saved.tabs.map((t) => ({ ...t, past: [], future: [] })) : old ? [{ id: tabId(), project: old, past: [], future: [] }] : [];
  return (ws = { tabs, active: saved?.active ?? tabs[0]?.id ?? "", listeners: new Set(), timer: 0, snapshot: null });
}
const activeTab = () => get().tabs.find((t) => t.id === get().active) ?? get().tabs[0];
function emit() {
  const w = get();
  w.snapshot = null;
  clearTimeout(w.timer);
  w.timer = window.setTimeout(() => writeStorage(KEY, { tabs: w.tabs.map(({ id, project }) => ({ id, project })), active: w.active }), 400);
  w.listeners.forEach((l) => l());
}

export function setProject(next: Project, history = true) {
  const t = activeTab();
  if (!t) return void openTab(next);
  if (history) {
    t.past.push(t.project);
    if (t.past.length > HISTORY) t.past.shift();
    t.future = [];
  }
  t.project = next;
  emit();
}

export function undo(dir: -1 | 1 = -1) {
  const t = activeTab();
  if (!t) return;
  const from = dir < 0 ? t.past : t.future;
  const to = dir < 0 ? t.future : t.past;
  if (!from.length) return;
  to.push(t.project);
  t.project = from.pop()!;
  emit();
}

export function openTab(project: Project) {
  const t = { id: tabId(), project, past: [], future: [] };
  get().tabs.push(t);
  get().active = t.id;
  emit();
}
export function switchTab(id: string) {
  get().active = id;
  emit();
}
export function closeTab(id: string) {
  const w = get();
  const i = w.tabs.findIndex((t) => t.id === id);
  w.tabs = w.tabs.filter((t) => t.id !== id);
  if (w.active === id) w.active = w.tabs[Math.max(0, i - 1)]?.id ?? "";
  emit();
}

const subscribe = (cb: () => void) => {
  get().listeners.add(cb);
  return () => void get().listeners.delete(cb);
};
export const useProject = () => useSyncExternalStore(subscribe, () => activeTab()?.project ?? null, () => null);
export function useTabs(): TabsView {
  return useSyncExternalStore(
    subscribe,
    () => (get().snapshot ??= { tabs: get().tabs.map((t) => ({ id: t.id, name: t.project.name, environment: t.project.environment ?? "motion-now" })), active: get().active }),
    () => EMPTY,
  );
}
const EMPTY: TabsView = { tabs: [], active: "" };

// ---------------------------------------------------------------- fonts

let fontState: "loading" | "ready" | "error" = "loading";
const fontListeners = new Set<() => void>();
let started = false;
function subscribeFonts(cb: () => void) {
  fontListeners.add(cb);
  if (!started) {
    started = true;
    Promise.all([loadFonts(), loadMbFonts()])
      .then(() => (fontState = "ready"), () => (fontState = "error"))
      .finally(() => fontListeners.forEach((l) => l()));
  }
  return () => fontListeners.delete(cb);
}
/** The free families Motion Builder tools ask for by name (KMR Apparat is commercial and stays out). */
function loadMbFonts() {
  const base = "/prototype-assets/studio/fonts/";
  const faces = [
    new FontFace("Geist Mono", `url(${base}GeistMono-VariableFont_wght.ttf)`, { weight: "100 900" }),
    new FontFace("Archivo Narrow", `url(${base}archivo-narrow-latin-wght-normal.woff2)`, { weight: "400 700" }),
    new FontFace("IBM Plex Mono", `url(${base}ibm-plex-mono-latin-400-normal.woff2)`, { weight: "400" }),
  ];
  return Promise.all(faces.map((f) => f.load().then((ff) => document.fonts.add(ff))));
}

export const useFonts = () => useSyncExternalStore(subscribeFonts, () => fontState, () => "loading" as const);
