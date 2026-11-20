"use client";

import { useStudio } from "../ui/context";
import { PAD } from "./timeline";
import type { TimeAt } from "./types";

/** Seconds along the top. Tap or drag on it to move the playhead (scrubbing pauses playback). */
export function Ruler({ setLane, timeAt }: { setLane: (el: HTMLDivElement | null) => void; timeAt: TimeAt }) {
  const { project, clock } = useStudio();
  const d = project.duration;
  const step = d <= 3 ? 0.25 : d <= 8 ? 0.5 : d <= 20 ? 1 : 5;
  const ticks = Array.from({ length: Math.floor(d / step + 1e-6) + 1 }, (_, i) => i * step);
  const scrub = (e: React.PointerEvent) => {
    if (e.type === "pointerdown") {
      e.currentTarget.setPointerCapture(e.pointerId);
      clock.pause();
    } else if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    clock.seek(Math.round(timeAt(e.clientX) * project.fps) / project.fps);
  };
  return (
    <div ref={setLane} className="relative h-11 min-w-0 flex-1 cursor-ew-resize touch-none lg:h-8" onPointerDown={scrub} onPointerMove={scrub} aria-label="Time ruler" role="slider" aria-valuemin={0} aria-valuemax={d} aria-valuenow={clock.t}>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: PAD, right: PAD }}>
        {ticks.map((s) => (
          <div key={s} className="absolute top-0 bottom-0" style={{ left: `${(s / d) * 100}%` }}>
            <div className={`absolute bottom-0 w-px bg-muted-foreground/60 ${Number.isInteger(s) ? "h-2.5" : "h-1.5"}`} />
            {Number.isInteger(s) && <span className="absolute top-1 -translate-x-1/2 font-mono text-[10px] text-muted-foreground tabular-nums">{s}s</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
