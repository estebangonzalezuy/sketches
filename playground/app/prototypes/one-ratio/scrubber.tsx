"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TChip } from "./t-chip";

export function Scrubber({
  t,
  playing,
  onToggle,
  onScrub,
}: {
  t: number;
  playing: boolean;
  onToggle: () => void;
  onScrub: (t: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <Button
        variant="outline"
        size="icon"
        aria-label={playing ? "Pause" : "Play"}
        onClick={onToggle}
        className="rounded-full sm:w-auto sm:px-3"
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
        <span className="hidden sm:inline">{playing ? "Pause" : "Play"}</span>
      </Button>
      <span className="flex shrink-0 items-center gap-1.5 font-mono text-sm text-muted-foreground">
        t = <TChip t={t} className="text-sm" />
      </span>
      <Slider
        aria-label="t"
        min={0}
        max={1}
        step={0.001}
        value={[t]}
        onValueChange={([v]) => onScrub(v ?? 0)}
        className="h-11"
      />
    </div>
  );
}
