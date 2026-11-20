"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { Clock } from "./clock";
import { useClock } from "./use-clock";
import type { Key } from "./types";

/**
 * One channel's keys on a time lane. Tap a key to select it (and jump there); drag it
 * sideways to retime it. Keys are 44px tap targets.
 */
export function KeyLane({
  label,
  keys,
  clock,
  selected,
  onSelect,
  onRetime,
}: {
  label: string;
  keys: Key[];
  clock: Clock;
  selected: string | null;
  onSelect: (k: Key) => void;
  onRetime: (k: Key, t: number) => void;
}) {
  const laneRef = useRef<HTMLDivElement>(null);
  const { t } = useClock(clock);
  const d = clock.duration;
  const timeAt = (clientX: number) => {
    const r = laneRef.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * d;
  };

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 truncate text-xs text-muted-foreground">{label}</span>
      <div className="flex-1 px-5">
        <div
          ref={laneRef}
          className="relative h-11 touch-none"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) clock.seek(timeAt(e.clientX));
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border" />
          <div className="pointer-events-none absolute inset-y-1 w-px bg-primary" style={{ left: `${(t / d) * 100}%` }} />
          {keys.map((k) => (
            <button
              key={k.id}
              type="button"
              aria-label={`Key at ${k.t.toFixed(2)}s`}
              aria-pressed={selected === k.id}
              className="absolute top-0 flex size-11 -translate-x-1/2 items-center justify-center"
              style={{ left: `${(Math.min(k.t, d) / d) * 100}%` }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                onSelect(k);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) onRetime(k, timeAt(e.clientX));
              }}
            >
              <span
                className={cn(
                  "size-3 rotate-45 rounded-[2px] border border-foreground",
                  selected === k.id ? "bg-primary" : "bg-background",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
