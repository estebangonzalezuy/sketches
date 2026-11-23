"use client";

import { useRef } from "react";
import { pathId } from "../model/paths";
import { setValue, toggleStopwatch } from "../model/ops";
import type { ParamPath, Value } from "../model/types";
import { useStudio } from "./context";

/**
 * Edits a param the After Effects way (keys it at the playhead when its stopwatch is on).
 * Repeated edits of the same param within 700 ms are one undo step (scrubs, typing).
 */
export function useEdit() {
  const { project, update, clock } = useStudio();
  const last = useRef<{ id: string; t: number } | null>(null);
  return {
    set(path: ParamPath, v: Value) {
      const id = pathId(path);
      const now = performance.now();
      const merge = last.current?.id === id && now - last.current.t < 700;
      last.current = { id, t: now };
      update(setValue(project, path, v, clock.t), !merge);
    },
    stopwatch(path: ParamPath) {
      last.current = null;
      update(toggleStopwatch(project, path, clock.t));
    },
  };
}
