"use client";

import { useEffect, useRef } from "react";
import { deleteKeys, setKeysEase } from "../model/ops";
import type { StudioApi } from "./context";

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/**
 * After Effects keys: Space play/pause, ←/→ one frame (⇧ ten), Home/End, Delete removes the
 * selected keys, F9 Easy Ease on them, ⌘Z / ⇧⌘Z undo and redo.
 */
export function useShortcuts(api: StudioApi) {
  const ref = useRef(api);
  useEffect(() => {
    ref.current = api;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      const { clock, project, update, sel, setSel, ws } = ref.current;
      const f = 1 / project.fps;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") ws.undo(e.shiftKey ? 1 : -1);
      else if (e.key === " ") {
        if (clock.playing) clock.pause();
        else clock.play();
      }
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        clock.pause();
        clock.seek(Math.round((clock.t + (e.key === "ArrowLeft" ? -1 : 1) * f * (e.shiftKey ? 10 : 1)) * project.fps) / project.fps);
      } else if (e.key === "Home") clock.seek(0);
      else if (e.key === "End") clock.seek(project.duration);
      else if ((e.key === "Delete" || e.key === "Backspace") && sel.keys.size) {
        update(deleteKeys(project, sel.keys));
        setSel({ keys: new Set() });
      } else if (e.key === "F9" && sel.keys.size) update(setKeysEase(project, sel.keys, "ease"));
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
