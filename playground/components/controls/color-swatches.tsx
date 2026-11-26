"use client";

import { cn } from "cn";

export type Swatch = { name: string; hex: string };

/**
 * A palette as clickable swatches (the colors are data: the user is picking one). The
 * current value is ringed. Small on mouse, 44px on touch.
 */
export function ColorSwatches({ swatches, value, onChange }: { swatches: readonly Swatch[]; value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup">
      {swatches.map((s) => {
        const on = s.hex.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={s.hex}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${s.name} ${s.hex}`}
            title={`${s.name} ${s.hex}`}
            onClick={() => onChange(s.hex)}
            className={cn("size-6 rounded-md border border-border pointer-coarse:size-11", on && "ring-2 ring-ring ring-offset-2 ring-offset-background")}
            style={{ backgroundColor: s.hex }}
          />
        );
      })}
    </div>
  );
}
