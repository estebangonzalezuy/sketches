"use client";

import { cn } from "@/lib/utils";
import { isAnimated } from "../model/tracks";
import { useStudio } from "../ui/context";
import { LayerBar } from "./layer-bar";
import type { Row } from "./rows";
import { PAD } from "./timeline";
import type { TimeAt } from "./types";
import { useKeyDrag } from "./use-key-drag";

/** Right column of a row: the layer's bar, or a property's keyframes. Empty space box-selects. */
export function RowLane({ row, timeAt }: { row: Row; timeAt: TimeAt }) {
  const { project, sel } = useStudio();
  const drag = useKeyDrag(timeAt);
  const d = project.duration;
  return (
    <div data-lane="1" className="relative h-11 min-w-0 flex-1 touch-none lg:h-7">
      <div className="pointer-events-none absolute inset-y-0" style={{ left: PAD, right: PAD }}>
        {row.kind === "layer" && <LayerBar layer={row.layer} timeAt={timeAt} />}
        {row.kind === "param" && isAnimated(row.track) &&
          row.track.keys.map((k) => {
            const on = sel.keys.has(k.id);
            return (
              <button
                key={k.id}
                type="button"
                data-key={k.id}
                aria-label={`${row.spec.label} key at ${k.t.toFixed(2)}s`}
                aria-pressed={on}
                className="pointer-events-auto absolute top-0 z-10 flex h-full w-8 -translate-x-1/2 cursor-grab items-center justify-center active:cursor-grabbing lg:w-5"
                style={{ left: `${(k.t / d) * 100}%` }}
                onPointerDown={(e) => drag.down(e, k, row.layer.id)}
                onPointerMove={drag.move}
                onPointerUp={drag.up}
              >
                <span className={cn("size-2.5 rotate-45 border", k.ease === "hold" ? "rounded-none" : "rounded-[1px]", on ? "border-primary bg-primary" : "border-foreground/70 bg-background")} />
              </button>
            );
          })}
      </div>
    </div>
  );
}
