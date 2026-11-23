"use client";

import { PauseIcon, PlayIcon, SkipBackIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClock } from "../use-clock";
import { useStudio } from "./context";

/** Play/pause and back to the start. Scrub on the timeline's ruler. */
export function Transport() {
  const { clock } = useStudio();
  const { playing } = useClock(clock);
  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" aria-label="Go to start (Home)" onClick={() => (clock.pause(), clock.seek(0))}><SkipBackIcon /></Button>
      <Button size="icon" variant="secondary" aria-label={playing ? "Pause (Space)" : "Play (Space)"} onClick={() => (playing ? clock.pause() : clock.play())}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </Button>
    </div>
  );
}
