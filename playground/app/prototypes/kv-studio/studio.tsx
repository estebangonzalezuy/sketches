"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClock } from "./clock";
import { ExportButton } from "./export-button";
import { KeyframesPanel } from "./keyframes-panel";
import { MixPanel } from "./mix-panel";
import { PosterStage } from "./poster-stage";
import { SourceMenu } from "./source-menu";
import { Transport } from "./transport";
import { useReducedMotion } from "./use-reduced-motion";
import { useStudio } from "./use-studio";
import { useShortcuts } from "./use-shortcuts";
import type { Anim, Settings } from "./types";

/** Poster, transport, and the two ways to animate it: a behavior mix or keyframes. */
export function Studio({ settings }: { settings: Settings }) {
  const { comp, anim, setAnim, source, setSource } = useStudio(settings);
  const [clock] = useState(createClock);
  const reduced = useReducedMotion();
  const fps = Number(settings.fps);
  const last = useRef(0);

  useEffect(() => clock.configure(settings.duration, settings.loop), [clock, settings.duration, settings.loop]);
  // Autoplay, except under reduced motion: then it rests on the finished poster until played.
  useEffect(() => {
    if (reduced) clock.seek(clock.duration);
    else clock.play();
    return () => clock.pause();
  }, [clock, reduced]);
  useShortcuts(clock, fps);

  /** Slider drags (coalesce) land in history as one step. */
  const update = useCallback(
    (fn: (a: Anim) => Anim, coalesce = false) => {
      const now = performance.now();
      setAnim(fn(anim), !(coalesce && now - last.current < 600));
      last.current = coalesce ? now : 0;
    },
    [anim, setAnim],
  );

  return (
    <>
      <PosterStage comp={comp} anim={anim} clock={clock} />
      <Transport clock={clock} />
      <div className="flex items-center justify-between gap-2">
        <SourceMenu source={source} onChange={(s) => setSource(s)} />
        <ExportButton comp={comp} anim={anim} duration={settings.duration} fps={fps} />
      </div>
      <Tabs defaultValue="mix" className="gap-3">
        <TabsList>
          <TabsTrigger value="mix">Mix</TabsTrigger>
          <TabsTrigger value="keys">Keyframes</TabsTrigger>
        </TabsList>
        <TabsContent value="mix">
          <MixPanel comp={comp} anim={anim} update={update} />
        </TabsContent>
        <TabsContent value="keys">
          <KeyframesPanel comp={comp} anim={anim} update={update} clock={clock} fps={fps} />
        </TabsContent>
      </Tabs>
    </>
  );
}
