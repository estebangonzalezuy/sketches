"use client";

import { useEffect, useRef } from "react";
import { ControlsLayout, useControls } from "@/components/controls";
import { Actions, LiveRecordButton, PngButton } from "@/components/tmsc/export-actions";
import { RespondentsEditor, useRespondents } from "@/components/tmsc/respondents";
import { Stage, StageArea } from "@/components/tmsc/stage";
import { useLiveRecording } from "@/components/tmsc/use-live-recording";
import { useReducedMotion } from "@/components/tmsc/use-reduced-motion";
import { format } from "@/lib/tmsc/formats";
import { controls, SLUG } from "./data";
import { drawMap } from "./draw";
import { MapScene } from "./scene";

export function RespondentMap() {
  const c = useControls(SLUG, controls);
  const data = useRespondents(SLUG);
  const reduced = useReducedMotion();
  const size = format(c.values.format);
  const scene = useRef<MapScene>(null);
  const rec = useLiveRecording(size, SLUG);
  const settings = { ...c.values, reduced };

  const get = () => {
    scene.current ??= new MapScene();
    scene.current.configure(data.people, settings, size.w, size.h);
    return scene.current;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") scene.current?.setFocus(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const header = (
    <Actions>
      <PngButton size={size} name={SLUG} draw={(ctx) => drawMap(ctx, get())} />
      <LiveRecordButton recording={rec.recording} onToggle={rec.toggle} />
    </Actions>
  );

  return (
    <ControlsLayout controls={c} header={header} footer={<RespondentsEditor data={data} />}>
      <StageArea>
        <Stage
          width={size.w}
          height={size.h}
          label="Respondent map: every survey respondent is a dot, grouped into clusters"
          recorder={rec.recorder}
          tick={(dt, now) => get().tick(dt, now)}
          draw={(ctx) => drawMap(ctx, get())}
          onPointer={(p) => {
            const sc = get();
            sc.pointer(p.type, p.x, p.y);
            const el = document.activeElement;
            if (p.type === "down" && el instanceof HTMLElement) el.blur();
          }}
          cursor={() => get().cursor()}
        />
      </StageArea>
    </ControlsLayout>
  );
}
