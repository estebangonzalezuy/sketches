"use client";

import type { RefObject } from "react";
import { cn } from "cn";
import type { CameraSetup } from "./camera";
import { easePath } from "./easing";
import type { RecordPlan } from "./timeline";

type Props = {
  plan: RecordPlan;
  camera: CameraSetup;
  pct: (s: number) => string;
  trackRef: RefObject<HTMLDivElement | null>;
  onIntroDuration: (seconds: number) => void;
};

/** The camera's lane under the page blocks: the opening move (drag its edge) and the drift. */
export function CameraLane({ plan, camera, pct, trackRef, onIntroDuration }: Props) {
  const intro = camera.intro !== "None";
  const introEnd = intro ? Math.min(camera.introDur, plan.duration) : 0;

  const resize = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const scale = plan.duration / trackRef.current!.getBoundingClientRect().width;
    const x0 = e.clientX;
    const d0 = camera.introDur;
    const move = (ev: PointerEvent) => onIntroDuration(Math.round(Math.min(10, Math.max(0.3, d0 + (ev.clientX - x0) * scale)) * 10) / 10);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="relative mt-1 h-7 border-t border-border">
      <span className="absolute top-1.5 left-1 text-[10px] text-muted-foreground">{!intro && camera.drift === "None" ? "Camera · still" : ""}</span>
      {intro && (
        <div className="absolute inset-y-1 overflow-hidden rounded-sm bg-primary/80 text-primary-foreground" style={{ left: 0, width: pct(introEnd) }} title={`${camera.intro} · ${camera.introDur.toFixed(1)} s`}>
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-0 size-full opacity-60" aria-hidden>
            <path d={easePath("Ease in-out", 100, 20)} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="relative truncate px-1 text-[10px] leading-5">{camera.intro}</span>
          <div className="absolute inset-y-0 right-0 w-3 cursor-ew-resize after:absolute after:inset-y-1 after:right-0.5 after:w-0.5 after:rounded-full after:bg-current after:opacity-60" onPointerDown={resize} aria-hidden />
        </div>
      )}
      {camera.drift !== "None" && (
        <div
          className={cn("absolute inset-y-2 rounded-sm bg-primary/30")}
          style={{ left: pct(introEnd), width: pct(plan.duration - introEnd) }}
          title={`${camera.drift} · ${Math.round(camera.driftAmount * 100)} %`}
        >
          <span className="truncate px-1 text-[10px] leading-3 text-foreground">{camera.drift}</span>
        </div>
      )}
    </div>
  );
}
