"use client";

import { useEffect, useRef } from "react";
import { renderFrame } from "../engine/compositor";
import { onMbReady } from "../engine/mb-host";
import { useStudio } from "./context";
import { Overlay } from "./overlay";

/**
 * The comp at the playhead. The canvas redraws on clock ticks and project edits (from refs,
 * so playing never re-renders React); the SVG overlay above it carries selection and handles.
 */
export function Viewport({ maxHeight }: { maxHeight: string }) {
  const { project, clock, prefs } = useStudio();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ project, prefs });
  const drawRef = useRef<() => void>(() => {});

  useEffect(() => {
    state.current = { project, prefs };
    drawRef.current();
  }, [project, prefs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !wrap || !ctx) return;
    let queued = 0;
    const draw = () => {
      const { project: p, prefs: pr } = state.current;
      const q = pr.quality === "half" ? 0.5 : 1;
      const w = Math.max(1, Math.round(wrap.clientWidth * window.devicePixelRatio * q));
      const h = Math.max(1, Math.round((w * p.height) / p.width));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      // held on whole frames, so the preview steps like the export at low frame rates
      const t = Math.floor(clock.t * p.fps + 1e-6) / p.fps;
      renderFrame(ctx, p, t, w / p.width);
    };
    const schedule = () => {
      if (!queued) queued = requestAnimationFrame(() => ((queued = 0), draw()));
    };
    drawRef.current = schedule;
    draw();
    const off = clock.subscribe(schedule);
    const offMb = onMbReady(schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    return () => {
      off();
      offMb();
      ro.disconnect();
      cancelAnimationFrame(queued);
    };
  }, [clock]);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto w-full touch-none overflow-hidden rounded-md border border-border select-none"
      style={{ aspectRatio: `${project.width} / ${project.height}`, maxWidth: `min(100%, calc(${maxHeight} * ${project.width / project.height}))` }}
    >
      <canvas ref={canvasRef} role="img" aria-label={`${project.name} at the playhead`} className="absolute inset-0 block size-full" />
      <Overlay />
    </div>
  );
}
