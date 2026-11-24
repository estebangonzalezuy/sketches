"use client";

import { useRef } from "react";
import { addKey, evalCurve, moveKey, removeKey } from "./curve";
import type { CurveMeta, Key } from "./types";
import { useSize } from "./use-size";

const H = 148;
const PAD = 14;

/**
 * A value-over-t graph. Drag a point to move it, tap empty space to add one,
 * Delete removes the selected inner point. The vertical line is the playhead.
 */
export function CurveEditor({
  meta,
  keys,
  t,
  selected,
  onSelect,
  onChange,
}: {
  meta: CurveMeta;
  keys: Key[];
  t: number;
  selected: number | null;
  onSelect: (i: number | null) => void;
  onChange: (keys: Key[]) => void;
}) {
  const [ref, { width: w }] = useSize<HTMLDivElement>();
  const dragging = useRef<number | null>(null);
  const range = meta.max - meta.min;
  const x = (tt: number) => PAD + tt * (w - 2 * PAD);
  const y = (v: number) => PAD + (1 - (v - meta.min) / range) * (H - 2 * PAD);

  const toPoint = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      t: (e.clientX - r.left - PAD) / (w - 2 * PAD),
      v: meta.min + (1 - (e.clientY - r.top - PAD) / (H - 2 * PAD)) * range,
    };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const hit = (e.target as Element).getAttribute("data-key");
    let index = hit === null ? -1 : Number(hit);
    if (index < 0) {
      const p = toPoint(e);
      const added = addKey(keys, p.t, Math.min(meta.max, Math.max(meta.min, p.v)));
      index = added.index;
      onChange(added.keys);
    }
    onSelect(index);
    dragging.current = index;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current === null) return;
    const p = toPoint(e);
    onChange(moveKey(keys, dragging.current, p.t, p.v, meta.min, meta.max));
  };

  const samples = Array.from({ length: 81 }, (_, i) => i / 80);
  const curve = samples.map((s, i) => `${i ? "L" : "M"}${x(s).toFixed(1)} ${y(evalCurve(keys, s)).toFixed(1)}`).join("");

  return (
    <div ref={ref} className="w-full">
      {w > 0 && (
        <svg
          width={w}
          height={H}
          role="application"
          aria-label={`${meta.label} curve`}
          tabIndex={0}
          className="touch-none rounded-lg bg-muted/40 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (dragging.current = null)}
          onPointerCancel={() => (dragging.current = null)}
          onKeyDown={(e) => {
            if ((e.key === "Delete" || e.key === "Backspace") && selected !== null) {
              onChange(removeKey(keys, selected));
              onSelect(null);
            }
          }}
        >
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={x(g)} x2={x(g)} y1={PAD} y2={H - PAD} className="stroke-border" />
          ))}
          {meta.min < 1 && meta.max > 1 && (
            <line x1={PAD} x2={w - PAD} y1={y(1)} y2={y(1)} className="stroke-border" strokeDasharray="3 3" />
          )}
          <text x={PAD + 2} y={PAD + 8} className="fill-muted-foreground font-mono text-[10px]">{meta.max}</text>
          <text x={PAD + 2} y={H - PAD - 3} className="fill-muted-foreground font-mono text-[10px]">{meta.min}</text>
          <path d={curve} className="fill-none stroke-foreground" strokeWidth={1.5} />
          <line x1={x(t)} x2={x(t)} y1={PAD} y2={H - PAD} className="stroke-muted-foreground" />
          <circle cx={x(t)} cy={y(evalCurve(keys, t))} r={3} className="fill-foreground" />
          {keys.map((k, i) => (
            <g key={i}>
              <circle cx={x(k.t)} cy={y(k.v)} r={5.5} strokeWidth={1.5}
                className={i === selected ? "fill-primary stroke-primary" : "fill-background stroke-foreground"} />
              {/* Invisible 44px hit target. */}
              <circle data-key={i} cx={x(k.t)} cy={y(k.v)} r={22} className="cursor-grab fill-transparent" />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
