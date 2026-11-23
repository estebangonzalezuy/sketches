"use client";

import { useEffect, useRef } from "react";
import { cn } from "cn";
import { ensureFont } from "@/lib/tmsc/fonts";
import type { LiveRecorder } from "@/lib/tmsc/video";

export type StagePointer = { type: "down" | "move" | "up" | "leave"; x: number; y: number; id: number };

export type StageProps = {
  /** Logical size: the export size. Drawing code always works in these units. */
  width: number;
  height: number;
  /** Advance state once per frame. `now` and `dt` are seconds. */
  tick?: (dt: number, now: number) => void;
  /** Draw the frame. Called for the preview and again for a running recording. */
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  recorder?: LiveRecorder | null;
  onPointer?: (p: StagePointer) => void;
  onWheel?: (deltaY: number) => void;
  /** Read every frame, so hover state can live outside React. */
  cursor?: () => string;
  label: string;
  className?: string;
};

const TYPES: Record<string, StagePointer["type"]> = { pointerdown: "down", pointermove: "move", pointerup: "up", pointercancel: "up", pointerleave: "leave" };

/**
 * A canvas locked to the export aspect ratio, as large as fits: under the bar on desktop,
 * the top 55% of the screen on mobile (the control sheet takes the rest). One rAF loop.
 */
export function Stage(props: StageProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let raf = 0;
    let last = performance.now();
    void ensureFont();
    const sizeCanvas = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(cv.clientWidth * dpr));
      const h = Math.max(1, Math.round(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
    };
    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(cv);
    const frame = (t: number) => {
      const p = latest.current;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      p.tick?.(dt, t / 1000);
      ctx.setTransform(cv.width / p.width, 0, 0, cv.height / p.height, 0, 0);
      p.draw(ctx, p.width, p.height);
      if (p.cursor) cv.style.cursor = p.cursor();
      const rec = p.recorder;
      if (rec) {
        rec.ctx.setTransform(rec.canvas.width / p.width, 0, 0, rec.canvas.height / p.height, 0, 0);
        p.draw(rec.ctx, p.width, p.height);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const wheel = (e: WheelEvent) => {
      const fn = latest.current.onWheel;
      if (!fn) return;
      e.preventDefault();
      fn(e.deltaY);
    };
    cv.addEventListener("wheel", wheel, { passive: false });
    return () => cv.removeEventListener("wheel", wheel);
  }, []);

  function onPointerEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const fn = latest.current.onPointer;
    const type = TYPES[e.type];
    if (!fn || !type) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (type === "down") e.currentTarget.setPointerCapture?.(e.pointerId);
    fn({
      type,
      x: ((e.clientX - r.left) / r.width) * latest.current.width,
      y: ((e.clientY - r.top) / r.height) * latest.current.height,
      id: e.pointerId,
    });
  }

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={props.label}
      onPointerDown={onPointerEvent}
      onPointerMove={onPointerEvent}
      onPointerUp={onPointerEvent}
      onPointerCancel={onPointerEvent}
      onPointerLeave={onPointerEvent}
      style={{ "--ar": (props.width / props.height).toFixed(4), aspectRatio: `${props.width} / ${props.height}` } as React.CSSProperties}
      className={cn(
        "block w-[min(100%,calc((55dvh-4rem)*var(--ar)))] select-none lg:w-[min(100%,calc((100dvh-6rem)*var(--ar)))]",
        // drag-driven tools own the touch; the rest let the page scroll
        props.onPointer || props.onWheel ? "touch-none" : "touch-pan-y",
        props.className,
      )}
    />
  );
}

/** Centers the stage: top of the page on mobile, middle of the free area on desktop. */
export function StageArea({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex w-full flex-1 flex-col items-center px-4 pt-4 pb-24 lg:justify-center lg:py-6">
      {children}
    </main>
  );
}
