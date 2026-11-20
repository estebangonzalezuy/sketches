"use client";

import { ControlsLayout, useControls } from "@/components/controls";
import { Spinner } from "@/components/ui/spinner";
import { controls, SLUG } from "./data";
import { Studio } from "./studio";
import { useFonts } from "./store";

/** Root: the global settings panel, and the studio once the KV fonts are in. */
export function KvStudio() {
  const c = useControls(SLUG, controls);
  const fonts = useFonts();
  return (
    <ControlsLayout controls={c}>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 pb-24 lg:py-6">
        {fonts === "ready" ? (
          <Studio settings={c.values} />
        ) : fonts === "error" ? (
          <p className="text-sm text-destructive">The KV fonts didn&apos;t load. Reload to try again.</p>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-lg border border-border">
            <Spinner />
          </div>
        )}
      </main>
    </ControlsLayout>
  );
}
