"use client";

import { useEffect } from "react";
import { useControls } from "@/components/controls";
import { Spinner } from "@/components/ui/spinner";
import { controls, SLUG } from "./data";
import { demoProject } from "./model/demo";
import { setProject, useFonts, useProject } from "./store";
import { Studio } from "./ui/studio";

/** Root: waits for the fonts, starts from the animated Motion, Now comp on a first visit. */
export function StudioApp() {
  const prefs = useControls(SLUG, controls);
  const fonts = useFonts();
  const project = useProject();
  useEffect(() => {
    if (fonts === "ready" && !project) setProject(demoProject(), false);
  }, [fonts, project]);
  if (fonts === "ready" && project) return <Studio project={project} prefs={prefs} />;
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      {fonts === "error" ? <p className="text-sm text-destructive">The fonts didn&apos;t load. Reload to try again.</p> : <Spinner />}
    </main>
  );
}
