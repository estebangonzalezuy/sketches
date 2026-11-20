"use client";

import { useRef } from "react";
import { TimerIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isAnimated, valueAt } from "../model/tracks";
import type { ParamPath, Spec, Track, Value } from "../model/types";
import { useClock } from "../use-clock";
import { useStudio } from "./context";
import { useEdit } from "./use-edit";

const round = (v: number, step = 0.01) => Math.round(v / step) * step;

/** One param: stopwatch, a label you can scrub sideways (After Effects style), and its control. */
export function ParamField({ path, spec, track }: { path: ParamPath; spec: Spec; track: Track }) {
  const { clock } = useStudio();
  const { t } = useClock(clock);
  const edit = useEdit();
  const v = valueAt(track, t);
  const animated = isAnimated(track);
  const scrub = useRef<{ x: number; v: number } | null>(null);
  const k = spec.kind === "number" ? (spec.display ?? 1) : 1;
  const step = spec.kind === "number" || spec.kind === "vec2" ? (spec.step ?? 1) : 1;

  const label = (
    <span
      className={cn("min-w-0 flex-1 truncate text-xs", spec.kind === "number" ? "cursor-ew-resize touch-none select-none" : "", animated ? "text-foreground" : "text-muted-foreground")}
      onPointerDown={(e) => {
        if (spec.kind !== "number") return;
        e.currentTarget.setPointerCapture(e.pointerId);
        scrub.current = { x: e.clientX, v: Number(v) };
      }}
      onPointerMove={(e) => {
        if (!scrub.current || spec.kind !== "number") return;
        const nv = scrub.current.v + (e.clientX - scrub.current.x) * step * (e.shiftKey ? 10 : 1);
        edit.set(path, Math.max(spec.min, Math.min(spec.max, round(nv, step))));
      }}
      onPointerUp={() => (scrub.current = null)}
    >
      {spec.label}
    </span>
  );

  return (
    <div className="flex min-h-11 items-center gap-1.5">
      {spec.kind !== "text" && (
        <button type="button" aria-label={`Animate ${spec.label}`} aria-pressed={animated} onClick={() => edit.stopwatch(path)} className="flex size-11 shrink-0 items-center justify-center -ml-2.5 lg:size-8">
          <TimerIcon className={cn("size-3.5", animated ? "text-primary" : "text-muted-foreground/60")} />
        </button>
      )}
      {spec.kind === "text" ? (
        <div className="flex w-full flex-col gap-1">
          {label}
          <Textarea value={String(v)} rows={2} onChange={(e) => edit.set(path, e.target.value)} />
        </div>
      ) : (
        <>
          {label}
          <div className="flex w-[58%] shrink-0 items-center justify-end gap-1">{control(spec, v, (nv) => edit.set(path, nv), k)}</div>
        </>
      )}
    </div>
  );
}

function num(value: number, onChange: (v: number) => void, k: number, label: string) {
  return (
    <Input
      type="number"
      aria-label={label}
      inputMode="decimal"
      value={Number((value * k).toFixed(2))}
      onChange={(e) => e.target.value !== "" && onChange(Number(e.target.value) / k)}
      className="h-8 min-w-0 px-1.5 text-right font-mono text-xs tabular-nums"
    />
  );
}

export function control(spec: Spec, v: Value, set: (v: Value) => void, k: number) {
  switch (spec.kind) {
    case "number":
      return <>{num(Number(v), set, k, spec.label)}{spec.unit && <span className="w-4 text-xs text-muted-foreground">{spec.unit}</span>}</>;
    case "vec2": {
      const [x, y] = v as [number, number];
      return <>{num(x, (nx) => set([nx, y]), 1, `${spec.label} x`)}{num(y, (ny) => set([x, ny]), 1, `${spec.label} y`)}</>;
    }
    case "color":
      return <input type="color" aria-label={spec.label} value={String(v)} onChange={(e) => set(e.target.value)} className="h-8 w-14 cursor-pointer rounded-md border border-input bg-transparent p-0.5" />;
    case "select":
      return (
        <NativeSelect aria-label={spec.label} value={String(v)} onChange={(e) => set(e.target.value)} className="w-full" size="sm">
          {spec.options.map((o) => <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>)}
        </NativeSelect>
      );
    case "boolean":
      return <Switch aria-label={spec.label} checked={Boolean(v)} onCheckedChange={set} />;
    default:
      return null;
  }
}
