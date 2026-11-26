"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ColorSwatches } from "./color-swatches";
import type { Control } from "./schema";

function format(v: number, step?: number): string {
  const decimals = step !== undefined ? (String(step).split(".")[1] ?? "").length : 2;
  return v.toFixed(decimals);
}

/** One row of the control panel. Every row is at least 44px tall for touch. */
export function ControlField({
  name,
  control,
  value,
  onChange,
}: {
  name: string;
  control: Control;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = useId();
  const label = control.label ?? name;

  switch (control.type) {
    case "number":
      return (
        <div className="flex min-h-11 flex-col justify-center gap-2.5">
          <div className="flex items-center justify-between text-sm">
            <Label htmlFor={id} className="font-normal">
              {label}
            </Label>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {format(value as number, control.step)}
            </span>
          </div>
          <Slider
            id={id}
            min={control.min}
            max={control.max}
            step={control.step ?? (control.max - control.min) / 100}
            value={[value as number]}
            onValueChange={([v]) => onChange(v)}
            className="py-1.5"
          />
        </div>
      );
    case "boolean":
      return (
        <div className="flex min-h-11 items-center justify-between">
          <Label htmlFor={id} className="font-normal">
            {label}
          </Label>
          <Switch id={id} checked={value as boolean} onCheckedChange={onChange} />
        </div>
      );
    case "select":
      return (
        <div className="flex min-h-11 items-center justify-between gap-3">
          <Label htmlFor={id} className="font-normal">
            {label}
          </Label>
          <NativeSelect id={id} value={value as string} onChange={(e) => onChange(e.target.value)}>
            {control.options.map((o) => (
              <NativeSelectOption key={o} value={o}>
                {o}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      );
    case "color":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Label htmlFor={id} className="font-normal">
              {label}
            </Label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{value as string}</span>
              <input
                id={id}
                type="color"
                value={value as string}
                onChange={(e) => onChange(e.target.value)}
                className="size-11 cursor-pointer rounded-md border border-input bg-transparent p-1 sm:size-8"
              />
            </div>
          </div>
          {control.swatches && <ColorSwatches swatches={control.swatches} value={value as string} onChange={onChange} />}
        </div>
      );
  }
}
