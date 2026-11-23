"use client";

import { useSyncExternalStore } from "react";
import type { TabsView, Workspace } from "./workspace";

const EMPTY: TabsView = { tabs: [], active: "" };

/** The active project of a workspace (null on the server and the first client render). */
export const useProject = (ws: Workspace) => useSyncExternalStore(ws.subscribe, ws.project, () => null);
export const useTabs = (ws: Workspace) => useSyncExternalStore(ws.subscribe, ws.tabs, () => EMPTY);
