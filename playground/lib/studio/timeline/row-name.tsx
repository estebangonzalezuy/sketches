"use client";

import { ChevronRightIcon, EyeIcon, EyeOffIcon, TimerIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { valueAt, isAnimated } from "../model/tracks";
import { mapLayer } from "../model/paths";
import type { Value } from "../model/types";
import { useClock } from "../use-clock";
import { useStudio } from "../ui/context";
import { useEdit } from "../ui/use-edit";
import type { Row } from "./rows";

const H = "h-11 lg:h-7";

const show = (v: Value, display = 1): string =>
  typeof v === "number" ? String(Math.round(v * display * 10) / 10) : Array.isArray(v) ? v.map((x) => Math.round(x * 10) / 10).join(", ") : typeof v === "boolean" ? (v ? "On" : "Off") : String(v).split("\n")[0];

/** Left column: twirl, eye and name for layers; twirl for groups; stopwatch, name and value for properties. */
export function RowName({ row, open, onToggle }: { row: Row; open: boolean; onToggle: () => void }) {
  const { project, update, sel, setSel, clock } = useStudio();
  const edit = useEdit();
  const { t } = useClock(clock);
  const twirl = (
    <button type="button" onClick={onToggle} aria-expanded={open} aria-label={open ? "Collapse" : "Expand"} className={cn("flex w-6 shrink-0 items-center justify-center", H)}>
      <ChevronRightIcon className={cn("size-3.5 transition-transform duration-200 ease-out-smooth", open && "rotate-90")} />
    </button>
  );
  const indent = 6 + (row.kind === "layer" ? 0 : row.depth * 12);
  const current = sel.layer === row.layer.id;

  return (
    <div className={cn("flex w-(--name) shrink-0 items-center gap-0.5 overflow-hidden pr-2", H, row.kind === "layer" && current && "bg-accent text-accent-foreground")} style={{ paddingLeft: indent }}>
      {row.kind !== "param" ? twirl : (
        <button type="button" aria-label={`Animate ${row.spec.label}`} aria-pressed={isAnimated(row.track)} onClick={() => edit.stopwatch(row.path)} className={cn("flex w-6 shrink-0 items-center justify-center", H)}>
          <TimerIcon className={cn("size-3.5", isAnimated(row.track) ? "text-primary" : "text-muted-foreground/50")} />
        </button>
      )}
      {row.kind === "layer" && (
        <button type="button" aria-label={row.layer.visible ? "Hide layer" : "Show layer"} className={cn("flex w-6 shrink-0 items-center justify-center text-muted-foreground", H)}
          onClick={() => update(mapLayer(project, row.layer.id, (l) => ({ ...l, visible: !l.visible })))}>
          {row.layer.visible ? <EyeIcon className="size-3.5" /> : <EyeOffIcon className="size-3.5" />}
        </button>
      )}
      <button type="button" onClick={() => setSel({ layer: row.layer.id, effect: row.kind === "group" && row.id.includes("/fx/") ? row.id.split("/fx/")[1] : sel.effect })}
        className={cn("min-w-0 flex-1 truncate text-left", H, row.kind === "layer" ? "font-medium" : row.kind === "group" ? "text-foreground" : "text-muted-foreground")}>
        {row.kind === "layer" ? row.layer.name : row.kind === "group" ? row.label : row.spec.label}
      </button>
      {row.kind === "param" && (
        <span className="max-w-[45%] shrink-0 truncate text-right font-mono text-[11px] text-primary/90 tabular-nums">
          {show(valueAt(row.track, t), row.spec.kind === "number" ? row.spec.display : 1)}
        </span>
      )}
    </div>
  );
}
