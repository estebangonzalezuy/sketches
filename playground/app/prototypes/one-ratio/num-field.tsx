"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

/** Small inline number input. Keeps the typed text while focused so "0." can be typed. */
export function NumField({
  value,
  step,
  label,
  onChange,
}: {
  value: number;
  step: number;
  label: string;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      type="number"
      inputMode="decimal"
      aria-label={label}
      step={step}
      value={draft ?? String(Number(value.toFixed(3)))}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = parseFloat(e.target.value);
        if (Number.isFinite(n)) onChange(n);
      }}
      onBlur={() => setDraft(null)}
      className="h-7 w-16 [appearance:textfield] px-1.5 text-center font-mono text-base text-foreground sm:w-14 md:text-xs [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}
