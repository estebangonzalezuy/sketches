"use client";

import { createContext, useContext } from "react";
import type { Clock } from "../clock";
import type { Project } from "../model/types";

export type Selection = { layer: string | null; effect: string | null; keys: Set<string> };

export type StudioApi = {
  project: Project;
  /** history=false folds this edit into the previous undo step (drags) */
  update: (next: Project, history?: boolean) => void;
  clock: Clock;
  sel: Selection;
  setSel: (s: Partial<Selection>) => void;
  prefs: { quality: string; paths: boolean; handles: boolean };
};

export const StudioContext = createContext<StudioApi | null>(null);

export function useStudio(): StudioApi {
  const api = useContext(StudioContext);
  if (!api) throw new Error("useStudio outside the studio");
  return api;
}
