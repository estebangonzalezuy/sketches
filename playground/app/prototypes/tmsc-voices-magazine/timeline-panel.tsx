"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { DriverRef } from "./driver";
import { EASE_NAMES, type EaseName } from "./easing";
import { segmentId, TimelineTrack } from "./timeline-track";
import type { RecordPlan } from "./timeline";
import { LIMITS, withEase, withOverride, withoutOverride, type Overrides } from "./timing";

type Props = { plan: RecordPlan; driverRef: DriverRef; overrides: Overrides; onOverrides: (o: Overrides) => void; onClose: () => void };

/**
 * The Record sequence as a timeline. Play previews it in the scene exactly as it will export;
 * the ruler scrubs; blocks show each hold and turn to scale and can be stretched or selected
 * to set a precise duration and, for turns, their own easing.
 */
export function TimelinePanel({ plan, driverRef, overrides, onOverrides, onClose }: Props) {
  const playhead = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const seg = plan.segments.find((s) => segmentId(s) === selected) ?? null;

  // the render loop reports the preview time; move the playhead without re-rendering React
  useEffect(() => {
    const d = driverRef.current;
    d.onPreview = (t) => {
      if (playhead.current) {
        playhead.current.style.display = t === null ? "none" : "block";
        if (t !== null) playhead.current.style.left = `${(t / plan.duration) * 100}%`;
      }
      if (readout.current) readout.current.textContent = `${(t ?? 0).toFixed(1)} / ${plan.duration.toFixed(1)} s`;
      const p = d.preview?.playing ?? false;
      setPlaying((was) => (was === p ? was : p));
    };
    if (readout.current) readout.current.textContent = `${(d.preview?.t ?? 0).toFixed(1)} / ${plan.duration.toFixed(1)} s`;
    return () => {
      d.onPreview = null;
    };
  }, [driverRef, plan]);

  const toggle = () => {
    const d = driverRef.current;
    if (d.preview?.playing) d.preview.playing = false;
    else d.preview = { t: !d.preview || d.preview.t >= plan.duration ? 0 : d.preview.t, playing: true };
    setPlaying(!!d.preview?.playing);
  };
  const scrub = (t: number) => {
    driverRef.current.preview = { t, playing: false };
    setPlaying(false);
  };

  const edited = Object.keys(overrides).length > 0;
  const part = seg?.kind === "turn" ? "turn" : "hold";
  const [lo, hi] = LIMITS[part];

  return (
    <div data-capture-hide className="pointer-events-auto mx-auto w-full max-w-3xl rounded-lg border border-border bg-background/90 p-2 backdrop-blur">
      <div className="mb-1 flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label={playing ? "Pause preview" : "Play preview"}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <span ref={readout} className="flex-1 text-sm tabular-nums text-muted-foreground" />
        {edited && (
          <Button variant="ghost" size="sm" onClick={() => onOverrides({})}>
            <RotateCcwIcon />
            Reset edits
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close timeline">
          <XIcon />
        </Button>
      </div>
      <TimelineTrack plan={plan} overrides={overrides} onOverrides={onOverrides} selected={selected} onSelect={setSelected} onScrub={scrub} playheadRef={playhead} />
      {seg && seg.kind !== "flip" && !(seg.kind === "hold" && seg.key === plan.sheets) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 truncate">{seg.kind === "turn" ? seg.label : `Hold · ${seg.label}`}</span>
          <label className="flex items-center gap-1.5 text-muted-foreground">
            <Input
              type="number"
              className="w-20"
              min={lo}
              max={hi}
              step={0.05}
              value={seg.dur.toFixed(2)}
              onChange={(e) => onOverrides(withOverride(overrides, seg.key, part, Number(e.target.value)))}
              aria-label="Duration in seconds"
            />
            s
          </label>
          {seg.kind === "turn" && (
            <NativeSelect className="w-36" value={seg.ease} onChange={(e) => onOverrides(withEase(overrides, seg.key, e.target.value as EaseName))} aria-label="Easing for this turn">
              {EASE_NAMES.map((n) => (
                <NativeSelectOption key={n} value={n}>
                  {n}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
          {seg.edited && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOverrides(withoutOverride(withoutOverride(overrides, seg.key, part), seg.key, "ease"))}
            >
              Use default
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
