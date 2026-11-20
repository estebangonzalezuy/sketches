"use client";

import { useRef } from "react";
import { applyMatrix, invertMatrix, isActive, layerMatrix, transformAt } from "../engine/evaluate";
import { contentBox, type Pt } from "../engine/geometry";
import { layerContent } from "../engine/pipeline";
import { setValue } from "../model/ops";
import { isAnimated, valueAt } from "../model/tracks";
import type { Project } from "../model/types";
import { EFFECTS } from "../tools/registry";
import { useClock } from "../use-clock";
import { useStudio } from "./context";
import { MotionPath } from "./motion-path";

type Drag = { kind: "move"; start: Pt; pos: Pt; base: Project; moved: boolean } | { kind: "handle"; effect: string; param: string; base: Project; moved: boolean };

/**
 * Selection box, effect handles and the motion path, drawn in comp px (SVG viewBox), so they
 * line up with the canvas at any size. Tap selects the front-most layer under the pointer;
 * drag moves it (keys position when its stopwatch is on, like After Effects).
 */
export function Overlay() {
  const { project, update, clock, sel, setSel, prefs } = useStudio();
  const { t: rawT } = useClock(clock);
  const t = Math.floor(rawT * project.fps + 1e-6) / project.fps;
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const toComp = (e: React.PointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * project.width, ((e.clientY - r.top) / r.height) * project.height];
  };

  const layer = project.layers.find((l) => l.id === sel.layer);
  const live = layer && isActive(layer, t) ? layer : undefined;
  const res = live ? layerContent(project, live, t, 0.25) : null;
  const m = live ? layerMatrix(transformAt(live, t)) : null;
  const box = res ? contentBox(res.content) : null;
  const corners = box && m ? ([[box.x, box.y], [box.x + box.w, box.y], [box.x + box.w, box.y + box.h], [box.x, box.y + box.h]] as Pt[]).map((p) => applyMatrix(m, p)) : [];
  const unit = project.width / 160;

  const pick = (p: Pt) =>
    [...project.layers].reverse().find((l) => {
      if (!isActive(l, t) || l.tool === "kv-paper") return false;
      const b = contentBox(layerContent(project, l, t, 0.25).content);
      const [x, y] = applyMatrix(invertMatrix(layerMatrix(transformAt(l, t))), p);
      return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    });

  const onDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    const p = toComp(e);
    const hit = pick(p);
    setSel({ layer: hit?.id ?? null, effect: null });
    if (!hit) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    clock.pause();
    drag.current = { kind: "move", start: p, pos: transformAt(hit, t).position, base: project, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !layer) return;
    const p = toComp(e);
    let next: Project;
    if (d.kind === "move") {
      next = setValue(d.base, { layer: layer.id, group: "transform", param: "position" }, [Math.round(d.pos[0] + p[0] - d.start[0]), Math.round(d.pos[1] + p[1] - d.start[1])], t);
    } else {
      const def = EFFECTS[layer.effects.find((x) => x.id === d.effect)!.tool];
      const h = def.handles!.find((x) => x.param === d.param)!;
      const lp = applyMatrix(invertMatrix(m!), p);
      next = setValue(d.base, { layer: layer.id, group: "effect", effect: d.effect, param: d.param }, h.fromLayer(lp, res!.boxes.get(d.effect)!), t);
    }
    update(next, !d.moved);
    d.moved = true;
  };
  const end = () => (drag.current = null);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${project.width} ${project.height}`}
      className="absolute inset-0 size-full"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {live && prefs.paths && isAnimated(live.transform.position) && <MotionPath layer={live} t={t} unit={unit} />}
      {corners.length > 0 && (
        <polygon points={corners.map((c) => c.join(",")).join(" ")} fill="none" className="pointer-events-none stroke-primary" strokeWidth={unit / 4} strokeDasharray={`${unit} ${unit / 2}`} />
      )}
      {live && prefs.handles && res && m &&
        live.effects.flatMap((fx) => {
          const def = EFFECTS[fx.tool];
          const b = res.boxes.get(fx.id);
          if (!fx.enabled || !def?.handles || !b) return [];
          return def.handles.map((h) => {
            const [x, y] = applyMatrix(m, h.toLayer(valueAt(fx.params[h.param], t), b));
            const on = sel.effect === fx.id;
            return (
              <g key={`${fx.id}/${h.param}`}>
                <circle cx={x} cy={y} r={unit * 2.2} fill="transparent" className="cursor-grab"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    clock.pause();
                    setSel({ effect: fx.id });
                    drag.current = { kind: "handle", effect: fx.id, param: h.param, base: project, moved: false };
                  }}
                  onPointerMove={onMove}
                  onPointerUp={end}
                />
                <circle cx={x} cy={y} r={unit * 0.7} className={on ? "pointer-events-none fill-primary stroke-background" : "pointer-events-none fill-background stroke-primary"} strokeWidth={unit / 4} />
              </g>
            );
          });
        })}
    </svg>
  );
}
