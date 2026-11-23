"use client";

import { useEffect, useRef } from "react";
import { FORMATS, type FormatId } from "./data";
import { drawFrame } from "./frame";
import { PinRenderer } from "./renderer";
import type { Settings } from "./types";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * The loop, live. Settings and words are read through refs, so moving a dial never restarts
 * the animation. Under reduced motion it shows one still frame at the full pose.
 */
export function PinCanvas({ settings, text }: { settings: Settings; text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ settings, text });
  const reduced = useReducedMotion();
  const [fw, fh] = FORMATS[settings.format as FormatId];

  useEffect(() => {
    state.current = { settings, text };
  }, [settings, text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = new PinRenderer(canvas);
    const start = performance.now();
    let raf = 0;
    const frame = () => {
      const { settings: s, text: tx } = state.current;
      const [w, h] = FORMATS[s.format as FormatId];
      const cw = Math.max(1, Math.round(canvas.clientWidth * window.devicePixelRatio));
      const ch = Math.max(1, Math.round((cw * h) / w));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      drawFrame(r, s, tx, reduced ? s.loop / 2 : (performance.now() - start) / 1000);
      if (!reduced) raf = requestAnimationFrame(frame);
    };
    frame();
    // a still frame still has to follow the dials
    const id = reduced ? window.setInterval(frame, 250) : 0;
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
      r.dispose();
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Corner pin kinetic text"
      className="mx-auto block w-full rounded-lg"
      style={{ aspectRatio: `${fw} / ${fh}`, maxWidth: `min(100%, calc(65dvh * ${fw / fh}))` }}
    />
  );
}
