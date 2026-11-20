"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Clock } from "./clock";
import { useClock } from "./use-clock";

/** Maps a pointer x to seconds on a lane element. */
export type TimeAt = (clientX: number) => number;

/**
 * One row of a timeline: a fixed label column and a time lane. Every lane uses the same
 * padding, so rows line up and keys at the edges stay tappable. Tapping or dragging empty
 * lane space scrubs the playhead.
 */
export function Lane({
  label,
  labelClassName = "w-16",
  clock,
  children,
  className,
}: {
  label: React.ReactNode;
  labelClassName?: string;
  clock: Clock;
  children?: (timeAt: TimeAt) => React.ReactNode;
  className?: string;
}) {
  // element in state (callback ref), so children can be given timeAt during render
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const { t } = useClock(clock);
  const d = clock.duration;
  const timeAt: TimeAt = (x) => {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (x - r.left) / r.width)) * d;
  };
  const scrub = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.type === "pointerdown") {
      e.currentTarget.setPointerCapture(e.pointerId);
      clock.pause();
    } else if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    clock.seek(timeAt(e.clientX));
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("shrink-0 truncate text-xs text-muted-foreground", labelClassName)}>{label}</div>
      <div className="min-w-0 flex-1 px-5">
        <div ref={setEl} className={cn("relative h-11 touch-none", className)} onPointerDown={scrub} onPointerMove={scrub}>
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border" />
          {children?.(timeAt)}
          <div className="pointer-events-none absolute inset-y-0 w-px bg-primary" style={{ left: `${(t / d) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

/** A keyframe diamond: a 44px tap target that selects on tap and retimes on drag. */
export function KeyDiamond({
  t,
  duration,
  selected,
  label,
  onSelect,
  onDrag,
}: {
  t: number;
  duration: number;
  selected: boolean;
  label: string;
  onSelect: () => void;
  onDrag?: (clientX: number) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      className="absolute top-0 z-10 flex size-11 -translate-x-1/2 items-center justify-center"
      style={{ left: `${(Math.min(t, duration) / duration) * 100}%` }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onSelect();
      }}
      onPointerMove={(e) => {
        if (onDrag && e.currentTarget.hasPointerCapture(e.pointerId)) onDrag(e.clientX);
      }}
    >
      <span className={cn("size-3 rotate-45 rounded-[2px] border border-foreground", selected ? "bg-primary" : "bg-background")} />
    </button>
  );
}
