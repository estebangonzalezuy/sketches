"use client";

import { ClipBar } from "./clip-bar";
import { elementName } from "./data";
import { TimelineLane } from "./timeline-lane";
import type { Clip, Poster } from "./types";

/**
 * Every poster element as a row on one time ruler, front-most first, each with the bar of
 * when it animates. Muted bars are the automatic timing; solid ones were set by hand.
 */
export function Timeline({ poster, clips, u, duration, fps, selected, onSelect, onScrub, onClip }: {
  poster: Poster;
  clips: Map<string, Clip>;
  u: number;
  duration: number;
  fps: number;
  selected: string | null;
  onSelect: (id: string) => void;
  onScrub: (u: number) => void;
  onClip: (id: string, c: Clip) => void;
}) {
  const step = 1 / Math.max(1, Math.round(duration * fps));
  const tick = duration <= 4 ? 0.5 : duration <= 12 ? 1 : 2;
  const ticks = Array.from({ length: Math.floor(duration / tick + 1e-6) + 1 }, (_, i) => i * tick);
  return (
    <div className="flex flex-col rounded-md border border-border py-1 pl-3">
      <TimelineLane label={<span className="text-muted-foreground">Time</span>} u={u} onScrub={onScrub} className="cursor-ew-resize">
        {() =>
          ticks.map((s) => (
            <div key={s} className="pointer-events-none absolute top-0 bottom-0" style={{ left: `${(s / duration) * 100}%` }}>
              <div className="absolute top-1 h-2 w-px bg-muted-foreground" />
              <span className="absolute top-3.5 -translate-x-1/2 font-mono text-[10px] text-muted-foreground tabular-nums">{s}</span>
            </div>
          ))
        }
      </TimelineLane>
      {[...poster.elements].reverse().map((e) => {
        const name = elementName(poster.elements, e);
        return (
          <div key={e.id} className={selected === e.id ? "rounded-sm bg-muted/50" : undefined}>
            <TimelineLane
              label={
                <button type="button" onClick={() => onSelect(e.id)} aria-pressed={selected === e.id} className={`min-h-11 w-full truncate text-left ${selected === e.id ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {name}
                </button>
              }
              u={u}
              onScrub={onScrub}
            >
              {(fracAt) => (
                <ClipBar clip={clips.get(e.id)!} label={name} step={step} fracAt={fracAt} selected={selected === e.id} custom={!!e.anim} onSelect={() => onSelect(e.id)} onChange={(c) => onClip(e.id, c)} />
              )}
            </TimelineLane>
          </div>
        );
      })}
    </div>
  );
}
