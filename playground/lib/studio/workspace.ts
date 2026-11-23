import { readStorage, storageKey, writeStorage } from "@/lib/storage";
import type { Project } from "./model/types";

/**
 * A workspace: the projects open in one prototype (the Studio, or a mini tool). One tab per
 * project, as in Motion Builder; each tab keeps its own undo history. Edits during a drag pass
 * `history: false` after the first one, so a drag is one undo step. Saved to localStorage
 * (`playground:<slug>:workspace`) a moment after edits. One instance per slug.
 */
type Tab = { id: string; project: Project; past: Project[]; future: Project[] };
type Stored = { tabs: { id: string; project: Project }[]; active: string };
export type TabsView = { tabs: { id: string; name: string; environment: string }[]; active: string };

export type Workspace = {
  slug: string;
  setProject(next: Project, history?: boolean): void;
  undo(dir?: -1 | 1): void;
  openTab(project: Project): void;
  switchTab(id: string): void;
  closeTab(id: string): void;
  project(): Project | null;
  tabs(): TabsView;
  subscribe(cb: () => void): () => void;
};

const HISTORY = 150;
let n = 0;
const tabId = () => `t${Date.now().toString(36)}${(n++).toString(36)}`;
const keyOf = (slug: string) => storageKey(slug, "workspace");
const all = new Map<string, Workspace>();

export function workspace(slug: string): Workspace {
  let w = all.get(slug);
  if (!w) all.set(slug, (w = create(slug)));
  return w;
}

/** The workspace if this page already loaded it (so a handoff can open a tab in memory). */
export const loadedWorkspace = (slug: string) => all.get(slug);

function create(slug: string): Workspace {
  const saved = readStorage<Stored>(keyOf(slug));
  // the Studio's projects from before tabs existed
  const old = readStorage<Project>(storageKey(slug, "project"));
  let tabs: Tab[] = saved?.tabs?.length ? saved.tabs.map((t) => ({ ...t, past: [], future: [] })) : old ? [{ id: tabId(), project: old, past: [], future: [] }] : [];
  let active = saved?.active ?? tabs[0]?.id ?? "";
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let snapshot: TabsView | null = null;

  const current = () => tabs.find((t) => t.id === active) ?? tabs[0];
  const emit = () => {
    snapshot = null;
    clearTimeout(timer);
    timer = setTimeout(() => writeStorage(keyOf(slug), { tabs: tabs.map(({ id, project }) => ({ id, project })), active }), 400);
    listeners.forEach((l) => l());
  };

  const ws: Workspace = {
    slug,
    setProject(next, history = true) {
      const t = current();
      if (!t) return ws.openTab(next);
      if (history) {
        t.past.push(t.project);
        if (t.past.length > HISTORY) t.past.shift();
        t.future = [];
      }
      t.project = next;
      emit();
    },
    undo(dir = -1) {
      const t = current();
      if (!t) return;
      const from = dir < 0 ? t.past : t.future;
      const to = dir < 0 ? t.future : t.past;
      if (!from.length) return;
      to.push(t.project);
      t.project = from.pop()!;
      emit();
    },
    openTab(project) {
      const t = { id: tabId(), project, past: [], future: [] };
      tabs.push(t);
      active = t.id;
      emit();
    },
    switchTab(id) {
      active = id;
      emit();
    },
    closeTab(id) {
      const i = tabs.findIndex((t) => t.id === id);
      tabs = tabs.filter((t) => t.id !== id);
      if (active === id) active = tabs[Math.max(0, i - 1)]?.id ?? "";
      emit();
    },
    project: () => current()?.project ?? null,
    tabs: () => (snapshot ??= { tabs: tabs.map((t) => ({ id: t.id, name: t.project.name, environment: t.project.environment ?? "motion-now" })), active }),
    subscribe(cb) {
      listeners.add(cb);
      return () => void listeners.delete(cb);
    },
  };
  return ws;
}

/**
 * Adds a project as a new, active tab of a workspace that isn't loaded on this page (it opens
 * there next time). Writes straight to its saved state.
 */
export function appendToStored(slug: string, project: Project) {
  const saved = readStorage<Stored>(keyOf(slug)) ?? { tabs: [], active: "" };
  const id = tabId();
  writeStorage(keyOf(slug), { tabs: [...saved.tabs, { id, project }], active: id });
}
