"use client";

import { RotateCcwIcon } from "lucide-react";
import { ControlsLayout, useControls } from "@/components/controls";
import { Button } from "@/components/ui/button";
import { controls, SLUG } from "./data";
import { Scrubber } from "./scrubber";
import { Stage } from "./stage";
import { TrackRow } from "./track-row";
import { usePlayer } from "./use-player";
import { useReducedMotion } from "./use-reduced-motion";
import { useTracks } from "./use-tracks";

export function OneRatio() {
  const c = useControls(SLUG, controls);
  const { tracks, update, reset } = useTracks();
  const reduced = useReducedMotion();
  const player = usePlayer(c.values.duration, c.values.loop, reduced);

  return (
    <ControlsLayout controls={c}>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4 pb-24 lg:py-6">
        <Stage tracks={tracks} t={player.t} showPath={c.values.path} ghosts={c.values.ghosts} />
        <Scrubber t={player.t} playing={player.playing} onToggle={player.toggle} onScrub={player.scrub} />
        <div className="flex flex-col gap-2">
          {tracks.map((tr) => (
            <TrackRow key={tr.id} track={tr} t={player.t} onChange={update} />
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcwIcon />
            Reset curves
          </Button>
        </div>
      </main>
    </ControlsLayout>
  );
}
