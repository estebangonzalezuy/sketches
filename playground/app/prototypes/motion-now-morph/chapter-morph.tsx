"use client";

import { useRef } from "react";
import { PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlsLayout, useControls } from "@/components/controls";
import { Actions, PngButton, RenderVideoButton } from "@/components/tmsc/export-actions";
import { RespondentsEditor, useRespondents } from "@/components/tmsc/respondents";
import { Stage, StageArea } from "@/components/tmsc/stage";
import { useReducedMotion } from "@/components/tmsc/use-reduced-motion";
import { clamp01 } from "@/lib/tmsc/ease";
import { format } from "@/lib/tmsc/formats";
import { MorphController } from "./controller";
import { controls, SLUG, VIDEO_HOLD, VIDEO_LEAD } from "./data";
import { drawMorph } from "./morph";

export function ChapterMorph() {
  const c = useControls(SLUG, controls);
  const v = c.values;
  const data = useRespondents(SLUG);
  const reduced = useReducedMotion();
  const size = format(v.format);
  const ctl = useRef<MorphController>(null);
  const drag = useRef<{ y: number; p: number } | null>(null);

  const get = () => {
    ctl.current ??= new MorphController();
    ctl.current.sync(data.people, v.chapter, size.w, size.h);
    return ctl.current;
  };
  const setProgress = (p: number) => c.set("progress", Math.round(clamp01(p) * 1000) / 1000);
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => drawMorph(ctx, w, h, get().state(v.chapter, v.easing, v.stagger));
  const videoLength = VIDEO_LEAD + v.duration + VIDEO_HOLD;

  const header = (
    <Actions>
      <Button onClick={() => get().play()}>
        <PlayIcon />
        Play
      </Button>
      <PngButton size={size} name={`${SLUG}-${v.chapter}`} draw={draw} />
      <RenderVideoButton
        size={size}
        name={`${SLUG}-${v.chapter}`}
        duration={Math.round(videoLength * 10) / 10}
        drawAt={(ctx, t) => {
          const m = get();
          const p = clamp01((t - VIDEO_LEAD) / v.duration);
          drawMorph(ctx, size.w, size.h, { ...m.state(v.chapter, v.easing, v.stagger, p, t), prev: null, blend: 1 });
        }}
      />
    </Actions>
  );

  return (
    <ControlsLayout controls={c} header={header} footer={<RespondentsEditor data={data} />}>
      <StageArea>
        <Stage
          width={size.w}
          height={size.h}
          label={`Chapter ${v.chapter}: respondents morph from a cloud into a chart. Scroll or drag to scrub.`}
          tick={(dt, now) => {
            const played = get().tick(dt, now, v.progress, v.duration, reduced);
            if (played !== null && Math.abs(played - v.progress) > 0.002) setProgress(played);
          }}
          draw={draw}
          onWheel={(dy) => {
            get().playing = null;
            setProgress(v.progress + dy / 1500);
          }}
          onPointer={(p) => {
            if (p.type === "down") {
              get().playing = null;
              drag.current = { y: p.y, p: v.progress };
            } else if (p.type === "move" && drag.current) setProgress(drag.current.p + (drag.current.y - p.y) / (size.h * 0.8));
            else if (p.type === "up") drag.current = null;
          }}
          cursor={() => (drag.current ? "grabbing" : "ns-resize")}
        />
      </StageArea>
    </ControlsLayout>
  );
}
