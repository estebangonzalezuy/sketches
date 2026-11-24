"use client";

import { RotateCcwIcon, ShuffleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlField } from "./control-field";
import type { ControlSchema } from "./schema";
import type { Controls } from "./use-controls";

/**
 * The fields of a schema plus Reset and Randomize. Layout-agnostic.
 * `header` / `footer` add a prototype's own panel content (actions, inputs, data) around them.
 */
export function ControlPanel<S extends ControlSchema>({
  controls,
  header,
  footer,
}: {
  controls: Controls<S>;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { schema, values, set } = controls;
  return (
    <div className="flex flex-col gap-4">
      {header}
      <div className="flex flex-col gap-3">
        {Object.entries(schema).map(([name, control]) => (
          <ControlField
            key={name}
            name={name}
            control={control}
            value={values[name]}
            onChange={(v) => set(name, v as never)}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={controls.reset}>
          <RotateCcwIcon />
          Reset
        </Button>
        <Button variant="outline" onClick={controls.randomize}>
          <ShuffleIcon />
          Randomize
        </Button>
      </div>
      {footer}
    </div>
  );
}
