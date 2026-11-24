"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Palette, Swatch } from "./types";

const SWATCHES: Swatch[] = ["ink", "cream", "blue", "pink", "lilac", "mint", "green", "orange", "yellow", "brown"];

export function NumberField({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-sm">
        <Label>{label}</Label>
        <span className="text-muted-foreground tabular-nums">{Math.round(value * 100) / 100}</span>
      </div>
      <Slider aria-label={label} min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

export function SwitchField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Label className="flex min-h-11 items-center justify-between text-sm">
      {label}
      <Switch checked={value} onCheckedChange={onChange} />
    </Label>
  );
}

export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** One colour, or (multi) an ordered set: tapping toggles a swatch in or out. */
export function SwatchField({ label, palette, value, onChange, multi }: { label: string; palette: Palette; value: Swatch[]; onChange: (v: Swatch[]) => void; multi?: boolean }) {
  const toggle = (s: Swatch) => {
    if (!multi) return onChange([s]);
    const next = value.includes(s) ? value.filter((x) => x !== s) : [...value, s];
    if (next.length) onChange(next);
  };
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {SWATCHES.map((s) => (
          <Button
            key={s}
            variant="outline"
            size="icon"
            aria-label={s}
            aria-pressed={value.includes(s)}
            className="aria-pressed:ring-2 aria-pressed:ring-ring"
            // the swatch is data (the poster palette), not UI styling
            style={{ backgroundColor: palette[s] }}
            onClick={() => toggle(s)}
          />
        ))}
      </div>
    </div>
  );
}
