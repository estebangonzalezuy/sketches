"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { patchKeys } from "../model/ops";
import type { Key, Project } from "../model/types";
import { useStudio } from "../ui/context";
import { dragHandle, handles, range, samples, segments } from "./graph-math";
import { PAD } from "./timeline";

export type GraphItem = { id: string; label: string; keys: Key[] };
type Drag = { kind: "key" | "h0" | "h1"; key: Key; seg?: ReturnType<typeof segments>["segs"][number]; item: GraphItem; base: Project; moved: boolean };

const COLORS = ["stroke-chart-1", "stroke-chart-2", "stroke-chart-3", "stroke-chart-4", "stroke-chart-5"];
const FILLS = ["fill-chart-1", "fill-chart-2", "fill-chart-3", "fill-chart-4", "fill-chart-5"];

/**
 * After Effects' graph editor: each property's curve over time with its keys and bezier
 * handles. Drag a key to move it in time (and in value, for numbers); drag a handle to shape
 * the ease of that segment. Numbers plot their values; other properties plot progress 0 → 1.
 */
export function Graph({ items }: { items: GraphItem[] }) {
  const { project, update, sel, setSel } = useStudio();
  const [size, setSize] = useState({ w: 600, h: 300 });
  const ro = useRef<ResizeObserver | null>(null);
  const drag = useRef<Drag | null>(null);
  const svg = useRef<SVGSVGElement | null>(null);
  const D = project.duration;
  const X = (t: number) => PAD + (t / D) * (size.w - 2 * PAD);
  const T = (x: number) => Math.max(0, Math.min(D, ((x - PAD) / (size.w - 2 * PAD)) * D));
  const snap = (t: number) => Math.round(t * project.fps) / project.fps;

  const measure = (el: SVGSVGElement | null) => {
    svg.current = el;
    ro.current?.disconnect();
    if (!el) return;
    ro.current = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.current.observe(el);
  };

  const plots = items.map((it, i) => {
    const { segs, numeric } = segments(it.keys);
    const [lo, hi] = range(it.keys, segs, numeric);
    const Y = (v: number) => 12 + (1 - (v - lo) / (hi - lo)) * (size.h - 24);
    const V = (y: number) => lo + (1 - (y - 12) / (size.h - 24)) * (hi - lo);
    return { it, i, segs, numeric, Y, V };
  });

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const p = plots.find((q) => q.it.id === d.item.id)!;
    let next: Project;
    if (d.kind === "key") {
      const patch: Partial<Key> = { t: snap(T(x)) };
      if (p.numeric) patch.v = Math.round(p.V(y) * 100) / 100;
      next = patchKeys(d.base, new Map([[d.key.id, patch]]));
    } else next = patchKeys(d.base, new Map([[d.seg!.a.id, { ease: dragHandle(d.seg!, d.kind === "h0" ? 0 : 1, T(x), p.V(y)) }]]));
    update(next, !d.moved);
    d.moved = true;
  };
  const start = (e: React.PointerEvent, d: Omit<Drag, "base" | "moved">) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { ...d, base: project, moved: false };
    if (d.kind === "key") setSel({ keys: e.shiftKey ? new Set([...sel.keys, d.key.id]) : new Set([d.key.id]) });
  };

  return (
    <svg ref={measure} className="size-full touch-none" onPointerMove={onMove} onPointerUp={() => (drag.current = null)}>
      {plots.map(({ it, i, segs, numeric, Y }) => {
        const pts = samples(segs, numeric, it.keys);
        const c = COLORS[i % COLORS.length];
        return (
          <g key={it.id}>
            <polyline points={pts.map(([t, v]) => `${X(t)},${Y(v)}`).join(" ")} fill="none" className={c} strokeWidth={1.5} />
            {segs.map((s) => {
              const h = handles(s);
              if (!h) return null;
              return h.map(([t, v], k) => {
                const from = k === 0 ? s.a : s.b;
                const fy = Y(k === 0 ? s.va : s.vb);
                return (
                  <g key={`${s.a.id}-${k}`}>
                    <line x1={X(from.t)} y1={fy} x2={X(t)} y2={Y(v)} className="stroke-muted-foreground" strokeWidth={1} />
                    <circle cx={X(t)} cy={Y(v)} r={14} fill="transparent" className="cursor-grab" onPointerDown={(e) => start(e, { kind: k === 0 ? "h0" : "h1", key: s.a, seg: s, item: it })} />
                    <circle cx={X(t)} cy={Y(v)} r={4} className={cn("pointer-events-none fill-background", c)} strokeWidth={1.5} />
                  </g>
                );
              });
            })}
            {it.keys.map((k, idx) => {
              const v = numeric ? Number(k.v) : idx === 0 ? 0 : 1;
              const on = sel.keys.has(k.id);
              return (
                <g key={k.id}>
                  <rect x={X(k.t) - 14} y={Y(v) - 14} width={28} height={28} fill="transparent" className="cursor-move" onPointerDown={(e) => start(e, { kind: "key", key: k, item: it })} />
                  <rect x={X(k.t) - 4.5} y={Y(v) - 4.5} width={9} height={9} transform={`rotate(45 ${X(k.t)} ${Y(v)})`} className={cn("pointer-events-none", on ? FILLS[i % FILLS.length] : "fill-background", c)} strokeWidth={1.5} />
                </g>
              );
            })}
            <text x={size.w - PAD} y={14 + i * 14} textAnchor="end" className={cn("text-[10px]", FILLS[i % FILLS.length])}>{it.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
