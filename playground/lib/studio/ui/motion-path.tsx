"use client";

import { valueAt } from "../model/tracks";
import type { Layer } from "../model/types";
import { useStudio } from "./context";

/** The layer's position over time as a dotted path, with a square at each key (as in After Effects). */
export function MotionPath({ layer, unit }: { layer: Layer; t: number; unit: number }) {
  const { project } = useStudio();
  const tr = layer.transform.position;
  if (!("keys" in tr) || tr.keys.length < 2) return null;
  const a = tr.keys[0].t;
  const b = tr.keys[tr.keys.length - 1].t;
  const pts: string[] = [];
  for (let t = a; t <= b + 1e-6; t += 1 / project.fps) pts.push((valueAt(tr, t) as number[]).join(","));
  return (
    <g className="pointer-events-none">
      <polyline points={pts.join(" ")} fill="none" className="stroke-primary" strokeWidth={unit / 5} strokeDasharray={`${unit / 3} ${unit / 2}`} />
      {tr.keys.map((k) => {
        const [x, y] = k.v as number[];
        return <rect key={k.id} x={x - unit * 0.5} y={y - unit * 0.5} width={unit} height={unit} className="fill-background stroke-primary" strokeWidth={unit / 5} />;
      })}
    </g>
  );
}
