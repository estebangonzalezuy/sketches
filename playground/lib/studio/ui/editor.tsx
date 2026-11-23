"use client";

import { useEffect } from "react";
import { useControls } from "@/components/controls";
import { Spinner } from "@/components/ui/spinner";
import { useFonts } from "../fonts";
import { ENVIRONMENTS } from "../model/environments";
import { controls } from "../prefs";
import { useProject, useTabs } from "../use-workspace";
import { workspace } from "../workspace";
import { Studio } from "./studio";
import { TabBar } from "./tab-bar";

export type StudioEditorProps = {
  /** the prototype's slug: its workspace and view prefs are stored under it */
  slug: string;
  /** project tabs (the Studio); mini tools have one project */
  tabs?: boolean;
  /** the environment a first project starts in (and, for mini tools, the only one) */
  environment?: string;
  /** show "Open in Studio" (mini tools) */
  handoff?: boolean;
};

/**
 * The studio editor any prototype can mount: the Studio itself (tabs, every environment) or a
 * mini tool (one effect, one project, "Open in Studio"). Waits for the fonts, and starts from the
 * environment's demo on a first visit.
 */
export function StudioEditor({ slug, tabs = false, environment = "motion-now", handoff = false }: StudioEditorProps) {
  const ws = workspace(slug);
  const prefs = useControls(slug, controls);
  const fonts = useFonts();
  const project = useProject(ws);
  const view = useTabs(ws);
  useEffect(() => {
    if (fonts === "ready" && !project && !view.tabs.length) ws.openTab((ENVIRONMENTS.find((e) => e.id === environment) ?? ENVIRONMENTS[0]).create());
  }, [fonts, project, view.tabs.length, ws, environment]);
  if (fonts === "ready" && project)
    return (
      <div className="flex flex-col lg:h-[calc(100dvh-3rem-1px)]">
        {tabs && <TabBar ws={ws} />}
        <Studio key={view.active} project={project} prefs={prefs} ws={ws} handoff={handoff} />
      </div>
    );
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      {fonts === "error" ? <p className="text-sm text-destructive">The fonts didn&apos;t load. Reload to try again.</p> : <Spinner />}
    </main>
  );
}
