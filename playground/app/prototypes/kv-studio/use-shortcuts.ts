"use client";

import { useEffect } from "react";
import type { Clock } from "./clock";
import { stepHistory } from "./store";

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** Space plays/pauses, ←/→ step a frame, ⌘Z / ⇧⌘Z undo and redo the animation. */
export function useShortcuts(clock: Clock, fps: number) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        stepHistory("anim", e.shiftKey ? 1 : -1);
      } else if (e.key === " ") {
        e.preventDefault();
        if (clock.playing) clock.pause();
        else clock.play();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        clock.pause();
        clock.seek(clock.t + (e.key === "ArrowLeft" ? -1 : 1) / fps);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clock, fps]);
}
