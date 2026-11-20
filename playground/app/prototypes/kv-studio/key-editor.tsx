"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { EASE_NAMES, PROPS } from "./data";
import type { EaseName, Key, Prop } from "./types";

/** Value and easing of the selected key. The ease shapes the segment that leaves this key. */
export function KeyEditor({
  k,
  prop,
  onChange,
  onRemove,
}: {
  k: Key;
  prop: Prop;
  onChange: (patch: Partial<Key>, coalesce?: boolean) => void;
  onRemove: () => void;
}) {
  const spec = PROPS[prop];
  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex-1">
          {spec.label} <span className="font-mono text-xs text-muted-foreground tabular-nums">@ {k.t.toFixed(2)}s</span>
        </span>
        <NativeSelect aria-label="Ease" value={k.ease} onChange={(e) => onChange({ ease: e.target.value as EaseName })}>
          {EASE_NAMES.map((e) => (
            <NativeSelectOption key={e} value={e}>
              {e}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button size="icon" variant="ghost" aria-label="Delete key" onClick={onRemove}>
          <Trash2Icon />
        </Button>
      </div>
      <div className="flex min-h-11 items-center gap-3">
        <Slider
          aria-label="Value"
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={[k.v]}
          onValueChange={([v]) => onChange({ v }, true)}
          className="flex-1 py-2"
        />
        <span className="w-14 text-right font-mono text-xs text-muted-foreground tabular-nums">
          {spec.step < 1 ? k.v.toFixed(2) : Math.round(k.v)}
        </span>
      </div>
    </div>
  );
}
