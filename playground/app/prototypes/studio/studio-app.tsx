"use client";

import { useEffect } from "react";
import { useControls } from "@/components/controls";
import { Spinner } from "@/components/ui/spinner";
import { controls, SLUG } from "./data";
import { ENVIRONMENTS } from "./model/environments";
import { openTab, useFonts, useProject, useTabs } from "./store";
import { TabBar } from "./ui/tab-bar";
import { Studio } from "./ui/studio";

/** Root: waits for the fonts, starts from the animated Motion, Now comp on a first visit. */
export function StudioApp() {
  const prefs = useControls(SLUG, controls);
  const fonts = useFonts();
  const project = useProject();
  const { tabs, active } = useTabs();
  // first visit (or every tab closed): the Motion, Now comp, animated with every tool
  useEffect(() => {
    if (fonts === "ready" && !project && !tabs.length) openTab(ENVIRONMENTS[0].create());
  }, [fonts, project, tabs.length]);
  if (fonts === "ready" && project)
    return (
      <div className="flex flex-col lg:h-[calc(100dvh-3rem-1px)]">
        <TabBar />
        <Studio key={active} project={project} prefs={prefs} />
      </div>
    );
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      {fonts === "error" ? <p className="text-sm text-destructive">The fonts didn&apos;t load. Reload to try again.</p> : <Spinner />}
    </main>
  );
}
