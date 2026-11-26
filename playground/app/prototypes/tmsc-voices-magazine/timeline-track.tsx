"use client";

import { useRef, type RefObject } from "react";
import { cn } from "cn";
import { easePath } from "./easing";
import type { RecordPlan, Segment } from "./timeline";
import { withOverride, type Overrides } from "./timing";
import { CameraLane } from "./timeline-camera";
import type { CameraSetup } from "./camera";

type Props = {
  plan: RecordPlan;
  overrides: Overrides;
  onOverrides: (o: Overrides) => void;
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** Scrubbing: a time in seconds while the pointer is down on the track. */
  onScrub: (t: number) => void;
  playheadRef: RefObject<HTMLDivElement | null>;
  /** The Record camera: an opening move (resizable) and a drift over the rest. */
  camera: CameraSetup;
  onIntroDuration: (seconds: number) => void;
};

export const segmentId = (s: Segment) => `${s.kind}:${s.key}`;

/**
 * The Record sequence to scale: holds (muted), turns (solid, with their easing curve), the
 * flip-through. Press or drag on the ruler to scrub; click a block to select it; drag a
 * block's right edge to change its duration.
 */
export function TimelineTrack({ plan, overrides, onOverrides, selected, onSelect, onScrub, playheadRef, camera, onIntroDuration }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const pct = (s: number) => `${(s / plan.duration) * 100}%`;

  const timeAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return Math.min(plan.duration, Math.max(0, ((clientX - r.left) / r.width) * plan.duration));
  };

  const scrub = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    onScrub(timeAt(e.clientX));
    const move = (ev: PointerEvent) => onScrub(timeAt(ev.clientX));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const resize = (e: React.PointerEvent, seg: Segment) => {
    e.stopPropagation();
    e.preventDefault();
    const part = seg.kind === "turn" ? "turn" : "hold";
    const width = track.current!.getBoundingClientRect().width;
    // measure against the length when the drag began, so the scale doesn't slide under the pointer
    const scale = plan.duration / width;
    const x0 = e.clientX;
    const base = overrides;
    onSelect(segmentId(seg));
    const move = (ev: PointerEvent) => onOverrides(withOverride(base, seg.key, part, seg.dur + (ev.clientX - x0) * scale));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const ticks = Array.from({ length: Math.floor(plan.duration) + 1 }, (_, i) => i);
  return (
    <div ref={track} className="relative w-full touch-none select-none">
      <div className="relative h-6 cursor-ew-resize border-b border-border" onPointerDown={scrub} title="Drag to scrub">
        {ticks.map((i) => (
          <div key={i} className={cn("absolute bottom-0 w-px bg-border", i % 5 === 0 ? "h-3" : "h-1.5")} style={{ left: pct(i) }}>
            {i % 5 === 0 && <span className="absolute bottom-3 left-1 text-[10px] tabular-nums text-muted-foreground">{i}s</span>}
          </div>
        ))}
      </div>
      <div className="relative h-12 overflow-hidden">
      {plan.segments.map((s) => {
        const id = segmentId(s);
        const editable = s.kind !== "flip" && !(s.kind === "hold" && s.key === plan.sheets);
        return (
          <div
            key={id}
            className={cn(
              "absolute inset-y-1 overflow-hidden rounded-sm",
              s.kind === "hold" ? "bg-muted text-muted-foreground" : "bg-foreground text-background",
              s.kind === "flip" && "opacity-60",
              s.edited && "ring-2 ring-inset ring-ring",
              selected === id && "outline outline-2 outline-offset-1 outline-foreground",
            )}
            style={{ left: pct(s.start), width: pct(s.dur) }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(selected === id ? null : id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title={`${s.label || s.kind} · ${s.dur.toFixed(2)} s${s.ease ? ` · ${s.ease}` : ""}`}
          >
            {s.kind === "hold" ? (
              <span className="absolute inset-x-1 top-1 truncate text-[10px] leading-tight">{s.label}</span>
            ) : (
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 size-full p-1" aria-hidden>
                <path d={easePath(s.ease ?? "Hand", 100, 40)} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              </svg>
            )}
            {editable && (
              <div
                className="absolute inset-y-0 right-0 w-3 cursor-ew-resize after:absolute after:inset-y-2 after:right-0.5 after:w-0.5 after:rounded-full after:bg-current after:opacity-50"
                onPointerDown={(e) => resize(e, s)}
                aria-hidden
              />
            )}
          </div>
        );
      })}
      </div>
      <CameraLane plan={plan} camera={camera} pct={pct} trackRef={track} onIntroDuration={onIntroDuration} />
      <div ref={playheadRef} className="pointer-events-none absolute inset-y-0 hidden w-0.5 -translate-x-1/2 bg-destructive" />
    </div>
  );
}
