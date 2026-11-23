"use client";

import { useState, useSyncExternalStore } from "react";
import { ControlsLayout, useControls } from "@/components/controls";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { controls, SLUG } from "./data";
import { ExportButton } from "./export-button";
import { PinCanvas } from "./pin-canvas";
import { loadFont } from "./word-textures";

let fontState: "loading" | "ready" | "error" = "loading";
const subscribeFont = (cb: () => void) => {
  loadFont().then(
    () => ((fontState = "ready"), cb()),
    () => ((fontState = "error"), cb()),
  );
  return () => {};
};

/** Stacked words on shared corner pins, in a seamless loop; dials on the side, MP4 out. */
export function KineticPin() {
  const c = useControls(SLUG, controls);
  const [text, setText] = useState("HARD WORK");
  const font = useSyncExternalStore(subscribeFont, () => fontState, () => "loading" as const);
  return (
    <ControlsLayout controls={c}>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-4 py-4 lg:justify-center lg:py-6">
        {font === "ready" ? (
          <PinCanvas settings={c.values} text={text} />
        ) : font === "error" ? (
          <p className="text-sm text-destructive">Archivo Narrow didn&apos;t load. Reload to try again.</p>
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center rounded-lg border border-border"><Spinner /></div>
        )}
        <div className="flex items-center gap-2" data-capture-hide>
          <Input aria-label="Words" value={text} onChange={(e) => setText(e.target.value)} className="min-w-0 flex-1 font-mono uppercase" />
          <ExportButton settings={c.values} text={text} />
        </div>
      </main>
    </ControlsLayout>
  );
}
