"use client";

import { useControls } from "@/components/controls";
import { Spinner } from "@/components/ui/spinner";
import { controls, SLUG } from "./data";
import { Studio } from "./studio";
import { useFonts } from "./store";

/** Root: the settings controls, and the studio once the KV fonts are in. */
export function KvStudio() {
  const c = useControls(SLUG, controls);
  const fonts = useFonts();
  if (fonts === "ready") return <Studio controls={c} />;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4 py-4">
      {fonts === "error" ? <p className="text-sm text-destructive">The KV fonts didn&apos;t load. Reload to try again.</p> : <Spinner />}
    </main>
  );
}
