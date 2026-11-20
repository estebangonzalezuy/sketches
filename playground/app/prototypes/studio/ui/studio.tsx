"use client";

import { useEffect, useMemo, useState } from "react";
import type { Controls } from "@/components/controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClock } from "../clock";
import type { controls } from "../data";
import type { Project } from "../model/types";
import { setProject } from "../store";
import { Timeline } from "../timeline/timeline";
import { useReducedMotion } from "../use-reduced-motion";
import { useWide } from "../use-wide";
import { CompPanel } from "./comp-panel";
import { StudioContext, type Selection, type StudioApi } from "./context";
import { Inspector } from "./inspector";
import { Toolbar } from "./toolbar";
import { Transport } from "./transport";
import { useShortcuts } from "./use-shortcuts";
import { Viewport } from "./viewport";

/**
 * The studio, laid out like After Effects: toolbar, viewer, and the inspector (effect
 * controls) beside it, with the timeline across the bottom. Below lg it stacks the viewer
 * over Timeline / Inspector tabs.
 */
export function Studio({ project, prefs }: { project: Project; prefs: Controls<typeof controls> }) {
  const [clock] = useState(createClock);
  const [sel, setSelState] = useState<Selection>({ layer: null, effect: null, keys: new Set() });
  const reduced = useReducedMotion();
  const wide = useWide();

  useEffect(() => clock.configure(project.duration, true), [clock, project.duration]);
  useEffect(() => {
    if (reduced) clock.seek(project.duration);
    else clock.play();
    return () => clock.pause();
    // the clock starts once; later duration changes go through configure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, reduced]);

  const api: StudioApi = useMemo(
    () => ({
      project,
      update: (next, history = true) => setProject(next, history),
      clock,
      sel,
      setSel: (s) => setSelState((cur) => ({ ...cur, ...s, ...(s.layer !== undefined && s.layer !== cur.layer && s.effect === undefined ? { effect: null } : {}) })),
      prefs: { quality: String(prefs.values.quality), paths: Boolean(prefs.values.paths), handles: Boolean(prefs.values.handles) },
    }),
    [project, clock, sel, prefs.values],
  );
  useShortcuts(api);

  const inspector = sel.layer ? <Inspector /> : <CompPanel prefs={prefs} />;
  const viewer = (maxH: string) => (
    <div className="flex flex-col gap-2">
      <Viewport maxHeight={maxH} />
      <Transport />
    </div>
  );

  return (
    <StudioContext.Provider value={api}>
      {wide ? (
        <div className="grid h-[calc(100dvh-3rem-1px)] grid-cols-[minmax(0,1fr)_340px] grid-rows-[auto_minmax(0,1fr)_40dvh]">
          <div className="col-span-2"><Toolbar /></div>
          <main className="flex min-h-0 flex-col justify-center overflow-hidden p-3">{viewer("calc(60dvh - 9rem)")}</main>
          <aside aria-label="Inspector" className="overflow-y-auto border-l border-border">{inspector}</aside>
          <section aria-label="Timeline" className="col-span-2 overflow-y-auto border-t border-border">
            <Timeline />
          </section>
        </div>
      ) : (
        <div className="flex flex-col pb-[env(safe-area-inset-bottom)]">
          <Toolbar />
          <div className="px-3 pt-3">{viewer("45dvh")}</div>
          <Tabs defaultValue="timeline" className="gap-2 pt-2">
            <TabsList className="mx-3 w-[calc(100%-1.5rem)]">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="inspector">{sel.layer ? "Layer" : "Comp"}</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline"><Timeline /></TabsContent>
            <TabsContent value="inspector">{inspector}</TabsContent>
          </Tabs>
        </div>
      )}
    </StudioContext.Provider>
  );
}
