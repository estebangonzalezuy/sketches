"use client";

import type { Clock } from "./clock";
import { Lane } from "./lane";

/** Seconds along the top of the timeline. Tap or drag anywhere on it to scrub. */
export function TimelineRuler({ clock, labelClassName }: { clock: Clock; labelClassName: string }) {
  const d = clock.duration;
  const step = d <= 4 ? 0.5 : d <= 12 ? 1 : 2;
  const ticks = Array.from({ length: Math.floor(d / step + 1e-6) + 1 }, (_, i) => i * step);
  return (
    <Lane label="Time" labelClassName={labelClassName} clock={clock} className="cursor-ew-resize">
      {() =>
        ticks.map((s) => (
          <div key={s} className="pointer-events-none absolute top-0 bottom-0" style={{ left: `${(s / d) * 100}%` }}>
            <div className="absolute top-0 h-2 w-px bg-muted-foreground" />
            <span className="absolute top-2.5 -translate-x-1/2 font-mono text-[10px] text-muted-foreground tabular-nums">
              {Number.isInteger(s) ? s : s.toFixed(1)}
            </span>
          </div>
        ))
      }
    </Lane>
  );
}
