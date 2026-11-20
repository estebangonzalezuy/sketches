"use client";

import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { BEHAVIOR_KINDS, BEHAVIORS, DIRS } from "./data";
import type { Behavior, BehaviorKind, Dir } from "./types";

/** One behavior in a layer's mix: what, which way, how much, and when inside Progress. */
export function BehaviorRow({
  b,
  onChange,
  onRemove,
}: {
  b: Behavior;
  onChange: (patch: Partial<Behavior>, coalesce?: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-2">
      <div className="flex items-center gap-2">
        <NativeSelect aria-label="Behavior" value={b.kind} onChange={(e) => onChange({ kind: e.target.value as BehaviorKind })} className="flex-1">
          {BEHAVIOR_KINDS.map((k) => (
            <NativeSelectOption key={k} value={k}>
              {BEHAVIORS[k].label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {BEHAVIORS[b.kind].dir && (
          <NativeSelect aria-label="Direction" value={b.dir} onChange={(e) => onChange({ dir: e.target.value as Dir })}>
            {DIRS.map((d) => (
              <NativeSelectOption key={d} value={d}>
                {d}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
        <Button size="icon" variant="ghost" aria-label="Remove behavior" onClick={onRemove}>
          <XIcon />
        </Button>
      </div>
      <Row label="Amount" value={`${Math.round(b.amount * 100)}%`}>
        <Slider aria-label="Amount" min={0} max={1} step={0.01} value={[b.amount]} onValueChange={([v]) => onChange({ amount: v }, true)} className="py-2" />
      </Row>
      <Row label="When" value={`${Math.round(b.start * 100)}–${Math.round(b.end * 100)}%`}>
        <Slider
          aria-label="When"
          min={0}
          max={1}
          step={0.01}
          minStepsBetweenThumbs={1}
          value={[b.start, b.end]}
          onValueChange={([s, e]) => onChange({ start: s, end: e }, true)}
          className="py-2"
        />
      </Row>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <span className="w-14 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex-1">{children}</div>
      <span className="w-14 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">{value}</span>
    </div>
  );
}
