"use client";

import { useCallback, useRef, useState } from "react";

/** Width/height of an element via ResizeObserver. Attach the returned callback as `ref`. */
export function useSize<T extends HTMLElement>() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: T | null) => {
    observer.current?.disconnect();
    if (!el) return;
    observer.current = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
    });
    observer.current.observe(el);
  }, []);
  return [ref, size] as const;
}
