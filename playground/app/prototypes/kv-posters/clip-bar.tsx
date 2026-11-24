"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { FracAt } from "./timeline-lane";
import type { Clip } from "./types";

type Mode = "move" | "start" | "end";

/**
 * An element's animation window as a bar. Drag the middle to move it, drag near either end to
 * stretch that end. Values snap to whole frames. The whole bar is the touch target.
 */
export function ClipBar({ clip, label, step, fracAt, selected, custom, onSelect, onChange }: {
  clip: Clip;
  label: string;
  /** one frame as a fraction of the length */
  step: number;
  fracAt: FracAt;
  selected: boolean;
  /** hand-set (solid) or automatic (muted) */
  custom: boolean;
  onSelect: () => void;
  onChange: (c: Clip) => void;
}) {
  const drag = useRef<{ mode: Mode; x0: number; start: number; end: number } | null>(null);
  const snap = (v: number) => Math.round(Math.max(0, Math.min(1, v)) / step) * step;
  const min = step * 2;
  return (
    <button
      type="button"
      aria-label={`${label}: ${Math.round(clip.start * 100)}–${Math.round(clip.end * 100)}%`}
      aria-pressed={selected}
      className="absolute inset-y-1.5 z-10 flex min-w-3 cursor-grab items-center active:cursor-grabbing"
      style={{ left: `${clip.start * 100}%`, width: `${Math.max(0.005, clip.end - clip.start) * 100}%` }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        const edge = Math.min(14, r.width / 3);
        const mode: Mode = e.clientX - r.left < edge ? "start" : r.right - e.clientX < edge ? "end" : "move";
        drag.current = { mode, x0: fracAt(e.clientX), start: clip.start, end: clip.end };
        onSelect();
      }}
      onPointerMove={(e) => {
        const g = drag.current;
        if (!g || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const dx = fracAt(e.clientX) - g.x0;
        if (g.mode === "move") {
          const len = g.end - g.start;
          const start = snap(Math.max(0, Math.min(1 - len, g.start + dx)));
          onChange({ ...clip, start, end: start + len });
        } else if (g.mode === "start") onChange({ ...clip, start: snap(Math.min(g.end - min, g.start + dx)) });
        else onChange({ ...clip, end: snap(Math.max(g.start + min, g.end + dx)) });
      }}
      onPointerUp={() => (drag.current = null)}
    >
      <span
        className={cn(
          "pointer-events-none size-full rounded-md border",
          custom ? "border-primary bg-primary/30" : "border-border bg-muted",
          selected && "ring-2 ring-ring",
        )}
      />
    </button>
  );
}
