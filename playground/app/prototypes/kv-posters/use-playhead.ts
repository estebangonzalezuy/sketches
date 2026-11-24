"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Playback time in seconds, looping over `duration`, stepped to whole frames. */
export function usePlayhead(duration: number, fps: number, autoplay: boolean) {
  const [t, setT] = useState(duration);
  const [playing, setPlaying] = useState(autoplay);
  const origin = useRef<number | null>(null);
  const base = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    origin.current = null;
    const tick = (now: number) => {
      if (origin.current === null) origin.current = now - base.current * 1000;
      const raw = ((now - origin.current) / 1000) % duration;
      setT(Math.floor(raw * fps) / fps);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, fps]);

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p) base.current = t >= duration ? 0 : t;
      return !p;
    });
  }, [t, duration]);

  const scrub = useCallback((v: number) => {
    setPlaying(false);
    base.current = v;
    setT(v);
  }, []);

  return { t: Math.min(t, duration), playing, toggle, scrub };
}
