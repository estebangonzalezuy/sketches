"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_T } from "./data";

/**
 * Owns the master ratio t. Play advances t by dt / duration each frame; scrubbing pauses
 * and writes t directly. Only t is state, so fast or repeated input can never stack tweens.
 */
export function usePlayer(duration: number, loop: boolean, reducedMotion: boolean) {
  const [t, setTState] = useState(INITIAL_T);
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(INITIAL_T);
  const settings = useRef({ duration, loop });

  useEffect(() => {
    settings.current = { duration, loop };
  }, [duration, loop]);

  const setT = useCallback((v: number) => {
    tRef.current = v;
    setTState(v);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const dt = (now - last) / 1000;
      last = now;
      let next = tRef.current + dt / settings.current.duration;
      if (next >= 1) {
        if (settings.current.loop) next %= 1;
        else {
          setT(1);
          setPlaying(false);
          return;
        }
      }
      setT(next);
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing, setT]);

  const toggle = useCallback(() => {
    // Reduced motion: jump between the two ends instead of animating.
    if (reducedMotion) return setT(tRef.current < 0.5 ? 1 : 0);
    if (playing) return setPlaying(false);
    if (tRef.current >= 1) setT(0);
    setPlaying(true);
  }, [playing, reducedMotion, setT]);

  const scrub = useCallback(
    (v: number) => {
      setPlaying(false);
      setT(v);
    },
    [setT],
  );

  return { t, playing, toggle, scrub };
}
