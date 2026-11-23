"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { moveKeys } from "../model/ops";
import { layerTracks, mapLayer } from "../model/paths";
import { isAnimated } from "../model/tracks";
import type { Layer, Project } from "../model/types";
import { useStudio } from "../ui/context";
import type { TimeAt } from "./types";

type Mode = "move" | "in" | "out";

/**
 * The layer's duration bar. Drag the middle to slide the layer in time (its keys come along);
 * drag an end to trim its in or out point.
 */
export function LayerBar({ layer: l, timeAt }: { layer: Layer; timeAt: TimeAt }) {
  const { project, update, sel, setSel } = useStudio();
  const d = useRef<{ mode: Mode; x0: number; base: Project; moved: boolean } | null>(null);
  const D = project.duration;
  const f = 1 / project.fps;
  const snap = (t: number) => Math.round(t * project.fps) / project.fps;

  const apply = (mode: Mode, dt: number, base: Project): Project => {
    const b = base.layers.find((x) => x.id === l.id)!;
    if (mode === "in") return mapLayer(base, l.id, (x) => ({ ...x, inPoint: Math.max(0, Math.min(b.outPoint - f, snap(b.inPoint + dt))) }));
    if (mode === "out") return mapLayer(base, l.id, (x) => ({ ...x, outPoint: Math.min(D, Math.max(b.inPoint + f, snap(b.outPoint + dt))) }));
    const shift = snap(Math.max(-b.inPoint, Math.min(D - b.outPoint, dt)));
    const ids = new Set(layerTracks(b).flatMap(({ track }) => (isAnimated(track) ? track.keys.map((k) => k.id) : [])));
    const from = new Map(layerTracks(b).flatMap(({ track }) => (isAnimated(track) ? track.keys.map((k) => [k.id, k.t] as [string, number]) : [])));
    return mapLayer(moveKeys(base, ids, shift, from), l.id, (x) => ({ ...x, inPoint: b.inPoint + shift, outPoint: b.outPoint + shift }));
  };

  return (
    <div
      className={cn(
        "pointer-events-auto absolute top-1/2 h-5 -translate-y-1/2 cursor-grab touch-none rounded-sm border lg:h-4",
        sel.layer === l.id ? "border-primary bg-primary/25" : "border-border bg-muted",
        !l.visible && "opacity-40",
      )}
      style={{ left: `${(l.inPoint / D) * 100}%`, width: `${((l.outPoint - l.inPoint) / D) * 100}%` }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        const edge = Math.min(14, r.width / 4);
        const mode: Mode = e.clientX - r.left < edge ? "in" : r.right - e.clientX < edge ? "out" : "move";
        d.current = { mode, x0: e.clientX, base: project, moved: false };
        setSel({ layer: l.id });
      }}
      onPointerMove={(e) => {
        const g = d.current;
        if (!g) return;
        const dt = timeAt(e.clientX) - timeAt(g.x0);
        if (!g.moved && Math.abs(dt) < 0.5 * f) return;
        update(apply(g.mode, dt, g.base), !g.moved);
        g.moved = true;
      }}
      onPointerUp={() => (d.current = null)}
    >
      <span className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize rounded-l-sm bg-foreground/20" />
      <span className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize rounded-r-sm bg-foreground/20" />
    </div>
  );
}
