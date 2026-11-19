"use client";

import { RotateCcwIcon, ShuffleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlField } from "./control-field";
import type { ControlSchema } from "./schema";
import type { Controls } from "./use-controls";

/** The fields of a schema plus Reset and Randomize. Layout-agnostic. */
export function ControlPanel<S extends ControlSchema>({ controls }: { controls: Controls<S> }) {
  const { schema, values, set } = controls;
  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
