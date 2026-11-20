"use client";

import { useEffect, useRef } from "react";
import type { Composition } from "@/lib/kv/model";
import { layerBounds, render, setImageLoadListener } from "@/lib/kv/render/render";
import { animatable, animate } from "./animate";
import type { Clock } from "./clock";
import type { Anim } from "./types";

/**
 * The poster at the playhead. Redraws on every clock tick and whenever the poster or the
 * animation changes; it reads both through refs so playing never re-renders React.
 */
export function PosterStage({
  comp,
  anim,
  clock,
  fps,
  maxHeight,
  onPick,
}: {
  comp: Composition;
  anim: Anim;
  clock: Clock;
  fps: number;
  /** CSS length the poster's height must fit in */
  maxHeight: string;
  /** tap on the poster selects the front-most layer under the finger */
  onPick: (layerId: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ comp, anim, fps });
  const drawRef = useRef<() => void>(() => {});

  useEffect(() => {
    state.current = { comp, anim, fps };
    drawRef.current();
  }, [comp, anim, fps]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !wrap || !ctx) return;
    let queued = 0;
    const draw = () => {
      const { comp: c, anim: a, fps: f } = state.current;
      const w = Math.max(1, Math.round(wrap.clientWidth * window.devicePixelRatio));
      const h = Math.max(1, Math.round((w * c.height) / c.width));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      render(ctx, c, { scale: w / c.width, // held on whole frames, so 12 fps previews as stepped as it exports
        fx: animate(c, a, Math.floor(clock.t * f + 1e-6) / f, clock.duration, layerBounds) });
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
      // the poster's own aspect, as wide as the height budget allows
      style={{ aspectRatio: `${comp.width} / ${comp.height}`, maxWidth: `min(100%, calc(${maxHeight} * ${comp.width / comp.height}))` }}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * comp.width;
        const y = ((e.clientY - r.top) / r.height) * comp.height;
        const hit = [...animatable(comp)].reverse().find((l) => {
          const b = layerBounds(l);
          return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
        });
        if (hit) onPick(hit.id);
      }}
    >
      <canvas ref={canvasRef} aria-label={`${comp.name}, animated`} role="img" className="block size-full" />
    </div>
  );
}
