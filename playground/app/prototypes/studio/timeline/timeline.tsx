"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { useClock } from "../use-clock";
import { useStudio } from "../ui/context";
import { Ruler } from "./ruler";
import { RowLane } from "./row-lane";
import { RowName } from "./row-name";
import { buildRows, timecode } from "./rows";
import { useMarquee } from "./use-marquee";

/** Lane padding (px) on both sides, so keys at 0 s and at the end stay grabbable. */
export const PAD = 12;

/**
 * The After Effects timeline: layers (front first) with twirl-down properties on the left;
 * a ruler, layer bars and keyframes on the right. Tap a stopwatch to animate a property, drag
 * keys (all selected ones move together), drag on empty lanes to box-select.
 */
export function Timeline() {
  const { project, clock } = useStudio();
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  // starts like pressing U in After Effects: every animated property, already open
  const [animatedOnly, setAnimatedOnly] = useState(true);
  const [lane, setLane] = useState<HTMLDivElement | null>(null);
  const { t } = useClock(clock);
  const rows = buildRows(project, open, animatedOnly);
  const timeAt = (x: number) => {
    if (!lane) return 0;
    const r = lane.getBoundingClientRect();
    return Math.max(0, Math.min(1, (x - r.left - PAD) / (r.width - 2 * PAD))) * project.duration;
  };
  const toggle = (id: string) => setOpen((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set(s).add(id)));
  const marquee = useMarquee();
  const frac = t / project.duration;

  return (
    <div className="relative flex min-w-0 flex-col text-xs select-none [--name:9.5rem] sm:[--name:15rem]">
      <div className="sticky top-[calc(3rem+1px)] z-20 flex border-b border-border bg-background lg:top-0">
        <div className="flex w-(--name) shrink-0 items-center gap-2 pr-2 pl-3">
          <span className="font-mono text-sm text-primary tabular-nums">{timecode(t, project.fps)}</span>
          <Toggle size="sm" pressed={animatedOnly} onPressedChange={setAnimatedOnly} aria-label="Show animated properties only (U)" className="ml-auto h-7 px-2 text-xs">
            U
          </Toggle>
        </div>
        <Ruler setLane={setLane} timeAt={timeAt} />
      </div>
      <div className="relative" {...marquee.handlers}>
        {rows.map((row) => (
          <div key={row.id} className="flex border-b border-border/60">
            <RowName row={row} open={open.has(row.id) || (animatedOnly && row.kind !== "param")} onToggle={() => toggle(row.id)} />
            <RowLane row={row} timeAt={timeAt} />
          </div>
        ))}
        {marquee.box}
        {/* one playhead line through every lane */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-primary"
          style={{ left: `calc(var(--name) + ${PAD}px + (100% - var(--name) - ${2 * PAD}px) * ${frac})` }}
        />
      </div>
    </div>
  );
}
