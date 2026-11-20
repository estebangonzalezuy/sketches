"use client";

import { ControlsLayout, useControls } from "@/components/controls";
import { controls, SLUG } from "./data";
import { FlowFieldCanvas } from "./flow-field-canvas";

export function FlowField() {
  const c = useControls(SLUG, controls);
  return (
    <ControlsLayout controls={c}>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4 lg:justify-center lg:py-6">
        <FlowFieldCanvas settings={c.values} />
      </main>
    </ControlsLayout>
  );
}
