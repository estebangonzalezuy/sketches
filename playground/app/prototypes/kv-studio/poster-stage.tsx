"use client";

import { useEffect, useRef } from "react";
import type { Composition } from "@/lib/kv/model";
import { layerBounds, render, setImageLoadListener } from "@/lib/kv/render/render";
import { animate } from "./animate";
import type { Clock } from "./clock";
import type { Anim } from "./types";

/**
 * The poster at the playhead. Redraws on every clock tick and whenever the poster or the
 * animation changes; it reads both through refs so playing never re-renders React.
 */
export function PosterStage({ comp, anim, clock }: { comp: Composition; anim: Anim; clock: Clock }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ comp, anim });
  const drawRef = useRef<() => void>(() => {});

  useEffect(() => {
    state.current = { comp, anim };
    drawRef.current();
  }, [comp, anim]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !wrap || !ctx) return;
    let queued = 0;
    const draw = () => {
      const { comp: c, anim: a } = state.current;
      const w = Math.max(1, Math.round(wrap.clientWidth * window.devicePixelRatio));
      const h = Math.max(1, Math.round((w * c.height) / c.width));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      render(ctx, c, { scale: w / c.width, fx: animate(c, a, clock.t, clock.duration, layerBounds) });
    };
    // coalesce bursts (slider drags, ticks) into one paint per frame
    const schedule = () => {
      if (!queued) queued = requestAnimationFrame(() => ((queued = 0), draw()));
    };
    drawRef.current = schedule;
    draw();
    setImageLoadListener(schedule);
    const off = clock.subscribe(schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    return () => {
      off();
      ro.disconnect();
      cancelAnimationFrame(queued);
      setImageLoadListener(() => {});
    };
  }, [clock]);

  return (
    <div
      ref={wrapRef}
      className="mx-auto w-full overflow-hidden rounded-lg border border-border"
      // the poster's own aspect, capped so a 9:16 still leaves room for the transport
      style={{ aspectRatio: `${comp.width} / ${comp.height}`, maxWidth: `min(100%, calc(60dvh * ${comp.width / comp.height}))` }}
    >
      <canvas ref={canvasRef} aria-label={`${comp.name}, animated`} role="img" className="block size-full" />
    </div>
  );
}
