"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

/** Play, the two states, and the master timeline. */
export function Transport({
  t,
  playing,
  target,
  onPlay,
  onState,
  onScrub,
}: {
  t: number;
  playing: boolean;
  target: number;
  onPlay: () => void;
  onState: (s: 0 | 1) => void;
  onScrub: (t: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
      <Button
        variant={playing ? "secondary" : "default"}
        size="icon"
        aria-label={playing ? "Pause" : "Play"}
        onClick={onPlay}
        className="sm:w-auto sm:px-3"
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
        <span className="hidden sm:inline">{playing ? "Pause" : "Play"}</span>
      </Button>
      <div role="group" aria-label="State" className="flex gap-0.5 rounded-lg border border-border p-0.5">
        {(["Rest", "Orbit"] as const).map((label, i) => (
          <Button
            key={label}
            variant="ghost"
            size="sm"
            aria-pressed={target === i}
            onClick={() => onState(i as 0 | 1)}
            className="aria-pressed:bg-muted aria-pressed:text-foreground text-muted-foreground"
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="flex min-w-0 basis-full items-center gap-2 sm:flex-1 sm:basis-0">
        <span className="font-mono text-xs text-muted-foreground">t</span>
        <span className="w-11 rounded-md bg-primary px-1.5 py-0.5 text-center font-mono text-xs text-primary-foreground tabular-nums">
          {t.toFixed(2)}
        </span>
        <Slider
          aria-label="Timeline"
          min={0}
          max={1}
          step={0.001}
          value={[t]}
          onValueChange={([v]) => onScrub(v ?? 0)}
          className="h-11"
        />
      </div>
    </div>
  );
}
