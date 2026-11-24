"use client";

import { ControlsLayout, useControls } from "@/components/controls";
import { Spinner } from "@/components/ui/spinner";
import { controls, SLUG } from "./data";
import { PosterEditor } from "./poster-editor";
import { useFonts } from "./store";

/** Root: settings panel, and the editor once the KV fonts are in (headlines are font outlines). */
export function KvPosters() {
  const c = useControls(SLUG, controls);
  const fonts = useFonts();
  return (
    <ControlsLayout controls={c}>
      {fonts === "ready" ? (
        <PosterEditor c={c} />
      ) : (
        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4 py-4">
          {fonts === "error" ? <p className="text-sm text-destructive">The fonts didn&apos;t load. Reload to try again.</p> : <Spinner />}
        </main>
      )}
    </ControlsLayout>
  );
}
