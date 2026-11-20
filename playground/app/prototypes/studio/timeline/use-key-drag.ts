"use client";

import { useRef } from "react";
import { allKeys, moveKeys } from "../model/ops";
import type { Key, Project } from "../model/types";
import { useStudio } from "../ui/context";
import type { TimeAt } from "./types";

type Drag = { x0: number; base: Project; ids: Set<string>; from: Map<string, number>; moved: boolean };

/**
 * Keyframe selection and dragging, After Effects style: click selects (shift adds or
 * removes), dragging moves every selected key together, snapped to frames. One undo step.
 */
export function useKeyDrag(timeAt: TimeAt) {
  const { project, update, sel, setSel } = useStudio();
  const d = useRef<Drag | null>(null);
  return {
    down(e: React.PointerEvent, key: Key, layer: string) {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      let ids = new Set(sel.keys);
      if (e.shiftKey) {
        if (ids.has(key.id)) ids.delete(key.id);
        else ids.add(key.id);
      } else if (!ids.has(key.id)) ids = new Set([key.id]);
      setSel({ keys: ids, layer });
      const all = allKeys(project);
      d.current = { x0: e.clientX, base: project, ids, from: new Map([...ids].map((id) => [id, all.get(id)?.key.t ?? 0])), moved: false };
    },
    move(e: React.PointerEvent) {
      const g = d.current;
      if (!g) return;
      const dt = timeAt(e.clientX) - timeAt(g.x0);
      if (!g.moved && Math.abs(dt) < 0.5 / project.fps) return;
      update(moveKeys(g.base, g.ids, dt, g.from), !g.moved);
      g.moved = true;
    },
    up() {
      d.current = null;
    },
  };
}
