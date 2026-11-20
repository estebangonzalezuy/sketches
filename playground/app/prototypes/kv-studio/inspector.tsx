"use client";

import type { Controls } from "@/components/controls";
import { ControlPanel } from "@/components/controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Composition } from "@/lib/kv/model";
import type { Clock } from "./clock";
import type { controls } from "./data";
import { KeyframesPanel } from "./keyframes-panel";
import { MixPanel } from "./mix-panel";
import type { Anim } from "./types";

type Update = (fn: (a: Anim) => Anim, coalesce?: boolean) => void;

/**
 * The right panel, as in the KV Editor: the selected layer's motion (behaviors and keys),
 * and the composition's settings (palette, length, frame rate, loop) with Reset and Randomize.
 */
export function Inspector(props: {
  comp: Composition;
  anim: Anim;
  update: Update;
  clock: Clock;
  fps: number;
  layerId: string;
  controls: Controls<typeof controls>;
}) {
  const { comp, anim, update, clock, fps, layerId } = props;
  return (
    <Tabs defaultValue="layer" className="gap-3 p-3">
      <TabsList className="w-full">
        <TabsTrigger value="layer">Layer</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="layer" className="flex flex-col gap-5">
        <MixPanel comp={comp} anim={anim} update={update} layerId={layerId} />
        <section className="flex flex-col gap-2 border-t border-border pt-3">
          <h3 className="text-xs font-medium text-muted-foreground">Keyframes</h3>
          <KeyframesPanel comp={comp} anim={anim} update={update} clock={clock} fps={fps} layerId={layerId} />
        </section>
      </TabsContent>
      <TabsContent value="settings">
        <ControlPanel controls={props.controls} />
      </TabsContent>
    </Tabs>
  );
}
