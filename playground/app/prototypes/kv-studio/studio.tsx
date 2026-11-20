"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Controls } from "@/components/controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { animatable } from "./animate";
import { createClock } from "./clock";
import type { controls } from "./data";
import { Inspector } from "./inspector";
import { LayersList } from "./layers-list";
import { PosterStage } from "./poster-stage";
import { StudioToolbar } from "./studio-toolbar";
import { TimelinePanel } from "./timeline-panel";
import { Transport } from "./transport";
import { useReducedMotion } from "./use-reduced-motion";
import { useShortcuts } from "./use-shortcuts";
import { useStudio } from "./use-studio";
import { useWide } from "./use-wide";
import type { Anim } from "./types";

/**
 * The editor. From lg up it's the KV Editor's grid (top bar; layers · canvas · inspector)
 * with the timeline docked along the bottom. Below lg it stacks: poster, transport, then
 * Timeline / Layer / Settings tabs.
 */
export function Studio({ controls: c }: { controls: Controls<typeof controls> }) {
  const settings = c.values;
  const { comp, anim, setAnim, source, setSource, format, setFormat } = useStudio(settings);
  const [clock] = useState(createClock);
  const reduced = useReducedMotion();
  const wide = useWide();
  const fps = Number(settings.fps);
  const last = useRef(0);
  const layers = animatable(comp);
  const [picked, setPicked] = useState<string | null>(null);
  const layerId = layers.some((l) => l.id === picked) ? picked! : (layers.at(-1)?.id ?? "");

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

  const toolbar = (
    <StudioToolbar wide={wide} source={source} setSource={setSource} format={format} setFormat={setFormat} comp={comp} anim={anim} duration={settings.duration} fps={fps} />
  );
  const stage = (maxHeight: string) => (
    <div className="flex flex-col gap-3">
      <PosterStage comp={comp} anim={anim} clock={clock} fps={fps} maxHeight={maxHeight} onPick={setPicked} />
      <Transport clock={clock} />
    </div>
  );
  const timeline = <TimelinePanel comp={comp} anim={anim} update={update} clock={clock} fps={fps} layerId={layerId} onSelectLayer={setPicked} />;
  const inspector = <Inspector comp={comp} anim={anim} update={update} clock={clock} fps={fps} layerId={layerId} controls={c} />;

  if (!wide)
    return (
      <div className="flex flex-col pb-[env(safe-area-inset-bottom)]">
        {toolbar}
        <div className="px-4 pt-4">{stage("50dvh")}</div>
        <Tabs defaultValue="timeline" className="gap-3 px-4 py-4">
          <TabsList className="w-full">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="layer">Layer</TabsTrigger>
            <TabsTrigger value="layers">Layers</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">{timeline}</TabsContent>
          <TabsContent value="layer" className="-mx-3">
            {inspector}
          </TabsContent>
          <TabsContent value="layers" className="-mx-2">
            <LayersList comp={comp} anim={anim} selected={layerId} onSelect={setPicked} />
          </TabsContent>
        </Tabs>
      </div>
    );

  return (
    <div className="grid h-[calc(100dvh-3rem-1px)] grid-cols-[236px_minmax(0,1fr)_300px] grid-rows-[48px_minmax(0,1fr)_34dvh]">
      <div className="col-span-3 flex items-stretch [&>div]:flex-1">{toolbar}</div>
      <aside className="overflow-y-auto border-r border-border">
        <LayersList comp={comp} anim={anim} selected={layerId} onSelect={setPicked} />
      </aside>
      <main className="flex min-h-0 flex-col justify-center overflow-hidden p-4">{stage("calc(66dvh - 10rem)")}</main>
      <aside className="overflow-y-auto border-l border-border">{inspector}</aside>
      <section aria-label="Timeline" className="col-span-3 overflow-y-auto border-t border-border px-3 pb-3">
        {timeline}
      </section>
    </div>
  );
}
