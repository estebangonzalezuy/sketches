"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_T } from "./data";

type Mode = "idle" | "play" | "seek";

/**
 * The master ratio t and the orb's spin angle, driven by one rAF loop.
 *   play   t runs 0 → 1 over `duration` (Pause, then Play, resumes)
 *   seek   t eases toward the target state (0 = rest, 1 = orbit); a new target mid-flight
 *          just changes where it heads, so rapid toggling reverses smoothly from where it is
 *   scrub  writes t directly and stops both
 */
export function useTimeline(duration: number, spin: number, reducedMotion: boolean) {
  const [frame, setFrame] = useState({ t: INITIAL_T, spinDeg: 0, mode: "idle" as Mode, target: 1 });
  const s = useRef({ ...frame, duration, spin, reducedMotion, paused: false });

  useEffect(() => {
    Object.assign(s.current, { duration, spin, reducedMotion });
  }, [duration, spin, reducedMotion]);

  const publish = useCallback(() => {
    const { t, spinDeg, mode, target } = s.current;
    setFrame({ t, spinDeg, mode, target });
  }, []);

  useEffect(() => {
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const st = s.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let changed = false;
      if (st.mode === "play") {
        st.t = Math.min(1, st.t + dt / st.duration);
        if (st.t >= 1) st.mode = "idle";
        changed = true;
      } else if (st.mode === "seek") {
        // Exponential approach: ease-out, interruptible, no stacking.
        st.t += (st.target - st.t) * (1 - Math.exp((-dt * 5) / st.duration));
        if (Math.abs(st.target - st.t) < 0.001) {
          st.t = st.target;
          st.mode = "idle";
        }
        changed = true;
      }
      if (st.spin > 0 && !st.reducedMotion) {
        st.spinDeg = (st.spinDeg + st.spin * dt) % 360;
        changed = true;
      }
      if (changed) publish();
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [publish]);

  const togglePlay = useCallback(() => {
    const st = s.current;
    if (st.reducedMotion) Object.assign(st, { t: st.t < 1 ? 1 : 0, mode: "idle" });
    else if (st.mode === "play") Object.assign(st, { mode: "idle", paused: true });
    // Play runs the whole timeline from 0, unless it resumes a pause.
    else Object.assign(st, { t: st.paused && st.t < 1 ? st.t : 0, mode: "play", target: 1, paused: false });
    publish();
  }, [publish]);

  const goTo = useCallback(
    (target: 0 | 1) => {
      const st = s.current;
      st.target = target;
      st.paused = false;
      if (st.reducedMotion) Object.assign(st, { t: target, mode: "idle" });
      else st.mode = "seek";
      publish();
    },
    [publish],
  );

  const toggleState = useCallback(() => goTo(s.current.target === 1 ? 0 : 1), [goTo]);

  const scrub = useCallback(
    (t: number) => {
      Object.assign(s.current, { t, mode: "idle", target: t < 0.5 ? 0 : 1, paused: false });
      publish();
    },
    [publish],
  );

  return { ...frame, playing: frame.mode === "play", togglePlay, goTo, toggleState, scrub };
}
