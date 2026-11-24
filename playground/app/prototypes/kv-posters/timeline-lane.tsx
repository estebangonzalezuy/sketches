"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Pointer x → fraction of the length (0–1) on a lane. */
export type FracAt = (clientX: number) => number;

/**
 * One timeline row: a label column and a lane with the playhead. Tapping or dragging empty
 * lane space scrubs. Every row uses the same padding so bars line up with the ruler.
 */
export function TimelineLane({ label, u, onScrub, className, children }: {
  label: React.ReactNode;
  /** playhead, fraction of the length */
  u: number;
  onScrub: (u: number) => void;
  className?: string;
  children?: (fracAt: FracAt) => React.ReactNode;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const fracAt: FracAt = (x) => {
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (x - r.left) / r.width));
  };
  const scrub = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.type === "pointerdown") e.currentTarget.setPointerCapture(e.pointerId);
    else if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    onScrub(fracAt(e.clientX));
  };
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 shrink-0 truncate text-xs sm:w-32">{label}</div>
      <div className="min-w-0 flex-1 px-3">
        <div ref={setEl} className={cn("relative h-11 touch-none", className)} onPointerDown={scrub} onPointerMove={scrub}>
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border" />
          {children?.(fracAt)}
          <div className="pointer-events-none absolute inset-y-0 z-20 w-px bg-primary" style={{ left: `${u * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
