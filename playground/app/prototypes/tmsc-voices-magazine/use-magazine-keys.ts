"use client";

import { useEffect } from "react";
import type { DriverRef } from "./driver";

/** ← → turn, Home flips back to the cover, End to the back cover. Leaves typing alone. */
export function useMagazineKeys(driverRef: DriverRef, live: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = driverRef.current;
      if (d.recording || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest?.("input, textarea, select, [contenteditable]")) return;
      const act = { ArrowRight: () => d.controller.turn(1), ArrowLeft: () => d.controller.turn(-1), Home: () => d.controller.goTo(0), End: () => d.controller.goTo(Infinity) }[e.key];
      if (!act) return;
      live();
      act();
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [driverRef, live]);
}
