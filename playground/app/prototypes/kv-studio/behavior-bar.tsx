"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { BEHAVIORS } from "./data";
import type { TimeAt } from "./lane";
import type { Behavior } from "./types";

type Mode = "move" | "start" | "end";
const snap = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 100) / 100;

/**
 * A behavior's window inside Progress, drawn as a bar on the timeline. Drag the middle to
 * move it; drag near either end to stretch that end. The whole bar is the touch target.
 */
export function BehaviorBar({
  b,
  duration,
  timeAt,
  selected,
  onSelect,
  onChange,
}: {
  b: Behavior;
  duration: number;
  timeAt: TimeAt;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Behavior>, coalesce?: boolean) => void;
}) {
  const drag = useRef<{ mode: Mode; x0: number; start: number; end: number } | null>(null);
  const width = Math.max(0.005, b.end - b.start);

  return (
    <button
      type="button"
      aria-label={`${BEHAVIORS[b.kind].label}, ${Math.round(b.start * 100)}–${Math.round(b.end * 100)}%`}
      aria-pressed={selected}
      className="absolute inset-y-0 z-10 flex min-w-3 cursor-grab items-center active:cursor-grabbing"
      style={{ left: `${b.start * 100}%`, width: `${width * 100}%` }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        const edge = Math.min(16, r.width / 3);
        const mode: Mode = e.clientX - r.left < edge ? "start" : r.right - e.clientX < edge ? "end" : "move";
        drag.current = { mode, x0: timeAt(e.clientX) / duration, start: b.start, end: b.end };
        onSelect();
      }}
      onPointerMove={(e) => {
        const g = drag.current;
        if (!g || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const dp = timeAt(e.clientX) / duration - g.x0;
        if (g.mode === "move") {
          const len = g.end - g.start;
          const start = snap(Math.max(0, Math.min(1 - len, g.start + dp)));
          onChange({ start, end: snap(start + len) }, true);
        } else if (g.mode === "start") onChange({ start: snap(Math.min(g.end - 0.01, g.start + dp)) }, true);
        else onChange({ end: snap(Math.max(g.start + 0.01, g.end + dp)) }, true);
      }}
      onPointerUp={() => (drag.current = null)}
    >
      <span
        className={cn(
          "flex h-6 w-full items-center overflow-hidden rounded-md border px-1.5 text-[10px] whitespace-nowrap",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-foreground",
        )}
      >
        {BEHAVIORS[b.kind].label}
      </span>
    </button>
  );
}
