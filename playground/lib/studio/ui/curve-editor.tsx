"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { curveOf, EASE_PRESETS, sameEase } from "../model/ease";
import type { Bezier, Ease } from "../model/types";
import { useReducedMotion } from "../use-reduced-motion";

/** The 0–1 box sits inside room for overshoot (y from -0.5 to 1.5), like cubic-bezier.com. */
const W = 200;
const H = 260;
const PAD = 14;
const BOX = W - 2 * PAD;
const X = (x: number) => PAD + x * BOX;
const Y = (y: number) => PAD + 30 + (1 - y) * BOX;
const toUnit = (px: number, py: number): [number, number] => [(px - PAD) / BOX, 1 - (py - PAD - 30) / BOX];
const round = (v: number) => Math.round(v * 100) / 100;

/**
 * The ease out of the selected keys as a curve: progress (y) over the segment's time (x).
 * Drag either handle to reshape it; presets are starting points. A dot runs the curve so
 * the timing can be felt, not just seen.
 */
export function CurveEditor({ value, mixed, onChange }: { value: Ease; mixed: boolean; onChange: (e: Ease, gesture: "start" | "move") => void }) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<0 | 1 | null>(null);
  const c: Bezier = curveOf(value) ?? [0, 0, 1, 1];
  const hold = value === "hold";

  const move = (e: React.PointerEvent, first = false) => {
    if (drag.current === null || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const [x, y] = toUnit(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
    const next = [...c] as Bezier;
    next[drag.current * 2] = round(Math.max(0, Math.min(1, x)));
    next[drag.current * 2 + 1] = round(Math.max(-0.5, Math.min(1.5, y)));
    onChange(next, first ? "start" : "move");
  };
  const handle = (i: 0 | 1) => {
    const [hx, hy] = i === 0 ? [c[0], c[1]] : [c[2], c[3]];
    const [ox, oy] = i === 0 ? [0, 0] : [1, 1];
    return (
      <g key={i}>
        <line x1={X(ox)} y1={Y(oy)} x2={X(hx)} y2={Y(hy)} className="stroke-muted-foreground" strokeWidth={1} />
        <circle
          cx={X(hx)}
          cy={Y(hy)}
          r={16}
          fill="transparent"
          className="cursor-grab touch-none active:cursor-grabbing"
          aria-label={i === 0 ? "Out handle" : "In handle"}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = i;
            move(e, true);
          }}
          onPointerMove={move}
          onPointerUp={() => (drag.current = null)}
        />
        <circle cx={X(hx)} cy={Y(hy)} r={5} className="pointer-events-none fill-primary stroke-background" strokeWidth={1.5} />
      </g>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-60 touch-none select-none" role="img" aria-label="Ease curve">
        <rect x={X(0)} y={Y(1)} width={BOX} height={BOX} className="fill-muted/40 stroke-border" strokeWidth={1} />
        {[0.25, 0.5, 0.75].map((g) => (
          <g key={g} className="stroke-border" strokeWidth={0.5}>
            <line x1={X(g)} y1={Y(0)} x2={X(g)} y2={Y(1)} />
            <line x1={X(0)} y1={Y(g)} x2={X(1)} y2={Y(g)} />
          </g>
        ))}
        {hold ? (
          <path d={`M${X(0)},${Y(0)} H${X(1)} V${Y(1)}`} fill="none" className="stroke-primary" strokeWidth={2} />
        ) : (
          <>
            <path d={`M${X(0)},${Y(0)} C${X(c[0])},${Y(c[1])} ${X(c[2])},${Y(c[3])} ${X(1)},${Y(1)}`} fill="none" className="stroke-primary" strokeWidth={2} />
            {handle(0)}
            {handle(1)}
          </>
        )}
      </svg>
      <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground tabular-nums">
        <span>{hold ? "hold" : `cubic-bezier(${c.join(", ")})`}</span>
        {mixed && <span>mixed · edits set all</span>}
      </div>
      {!hold && <Preview curve={c} />}
      <div className="flex flex-wrap gap-1">
        {EASE_PRESETS.map((p) => (
          <Button key={p.label} size="xs" variant="outline" aria-pressed={!mixed && sameEase(p.ease, value)} className={cn(!mixed && sameEase(p.ease, value) && "border-primary")} onClick={() => onChange(p.ease, "start")}>
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

/** A dot crossing a track on this curve, looping, so the timing can be felt. Still under reduced motion. */
function Preview({ curve }: { curve: Bezier }) {
  const dot = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const key = curve.join(",");
  useEffect(() => {
    const el = dot.current;
    if (!el || reduced) return;
    const a = el.animate([{ left: "0%" }, { left: "100%" }], { duration: 1100, iterations: Infinity, easing: `cubic-bezier(${key})`, direction: "alternate" });
    return () => a.cancel();
  }, [key, reduced]);
  return (
    <div className="relative mx-1 h-3">
      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
      <span ref={dot} className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" style={{ left: "0%" }} />
    </div>
  );
}
