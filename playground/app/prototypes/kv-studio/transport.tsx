"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { Clock } from "./clock";
import { useClock } from "./use-clock";

const STEPS = 1000;

/** Play/pause and the Progress slider: the one control that drives the whole poster. */
export function Transport({ clock }: { clock: Clock }) {
  const { t, playing } = useClock(clock);
  const d = clock.duration;
  return (
    <div className="flex items-center gap-3">
      <Button
        size="icon"
        variant="secondary"
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => (playing ? clock.pause() : clock.play())}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </Button>
      <Slider
        aria-label="Progress"
        min={0}
        max={STEPS}
        step={1}
        value={[Math.round((t / d) * STEPS)]}
        onValueChange={([v]) => {
          clock.pause();
          clock.seek((v / STEPS) * d);
        }}
        className="flex-1 py-3"
      />
      <span className="w-20 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
        {t.toFixed(2)} / {d.toFixed(1)}s
      </span>
    </div>
  );
}
