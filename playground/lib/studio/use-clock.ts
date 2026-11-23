"use client";

import { useSyncExternalStore } from "react";
import type { Clock } from "./clock";

/** Subscribes a component to the playhead (time in seconds and play state). */
export function useClock(clock: Clock) {
  const t = useSyncExternalStore(clock.subscribe, () => clock.t, () => 0);
  const playing = useSyncExternalStore(clock.subscribe, () => clock.playing, () => false);
  return { t, playing };
}
