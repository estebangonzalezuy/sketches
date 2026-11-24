"use client";

import { useState } from "react";
import { ControlsLayout, useControls } from "@/components/controls";
import { evalCurve } from "./curve";
import { CurveRow } from "./curve-row";
import { controls, CURVE_META, SLUG } from "./data";
import { Stage } from "./stage";
import { Transport } from "./transport";
import type { CurveId, RigParams } from "./types";
import { useCurves } from "./use-curves";
import { useReducedMotion } from "./use-reduced-motion";
import { useTimeline } from "./use-timeline";

export function OrbitRig() {
  const c = useControls(SLUG, controls);
  const v = c.values;
  const { curves, setCurve, resetCurve } = useCurves();
  const tl = useTimeline(v.duration, v.spin, useReducedMotion());
  const [open, setOpen] = useState<CurveId | null>("xSquash");

  const squash = {
    x: evalCurve(curves.xSquash, tl.t),
    y: evalCurve(curves.ySquash, tl.t),
    z: evalCurve(curves.zSquash, tl.t),
  };
  const params: RigParams = {
    cards: v.cards,
    orbDelay: v.orbDelay,
    mainRotate: v.mainRotate,
    mainX: v.mainX,
    mainZ: v.mainZ,
    orbSize: v.orbSize,
    orbZ: v.orbZ,
    orbCardScale: v.orbCardScale,
    slice: v.slice,
  };

  return (
    <ControlsLayout controls={c}>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4 pb-24 lg:py-6">
        <Stage
          params={params}
          squash={squash}
          t={tl.t}
          spinDeg={tl.spinDeg}
          tint={v.tint}
          sphere={v.debugSphere}
          paths={v.paths}
          hideFront={v.hideFront}
          onToggle={tl.toggleState}
        />
        <Transport
          t={tl.t}
          playing={tl.playing}
          target={tl.target}
          onPlay={tl.togglePlay}
          onState={tl.goTo}
          onScrub={tl.scrub}
        />
        <section aria-label="Curves" className="rounded-xl border border-border bg-card">
          {CURVE_META.map((m) => (
            <CurveRow
              key={m.id}
              meta={m}
              keys={curves[m.id]}
              t={tl.t}
              open={open === m.id}
              onToggle={() => setOpen((o) => (o === m.id ? null : m.id))}
              onChange={(keys) => setCurve(m.id, keys)}
              onReset={() => resetCurve(m.id)}
            />
          ))}
        </section>
      </main>
    </ControlsLayout>
  );
}
