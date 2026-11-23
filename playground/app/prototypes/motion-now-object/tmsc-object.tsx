"use client";

import { useRef } from "react";
import { ControlsLayout, useControls } from "@/components/controls";
import { Actions, PngButton, RenderVideoButton } from "@/components/tmsc/export-actions";
import { Stage, StageArea } from "@/components/tmsc/stage";
import { usePersistent } from "@/components/tmsc/use-persistent";
import { useReducedMotion } from "@/components/tmsc/use-reduced-motion";
import { format } from "@/lib/tmsc/formats";
import { sanitizeAnswers } from "./answers";
import { AnswersForm } from "./answers-form";
import { controls, DEFAULT_ANSWERS, LOOP, SLUG } from "./data";
import { drawObject } from "./render";
import { loopAt, Spin } from "./spin";

export function TmscObject() {
  const c = useControls(SLUG, controls);
  const v = c.values;
  const [answers, setAnswers] = usePersistent(SLUG, "answers", DEFAULT_ANSWERS, sanitizeAnswers);
  const reduced = useReducedMotion();
  const size = format(v.format);
  const spin = useRef<Spin>(null);
  const clock = useRef(0);
  const get = () => (spin.current ??= new Spin());
  const frame = (theta: number, orbit: number) => ({ theta, orbit, orbitScale: v.orbit, palette: v.palette, answers });

  const header = (
    <Actions>
      <AnswersForm answers={answers} onChange={setAnswers} />
      <div className="mt-2 grid gap-2">
        <PngButton size={size} name={SLUG} draw={(ctx, w, h) => drawObject(ctx, w, h, frame(get().theta, get().orbit))} />
        <RenderVideoButton
          size={size}
          name={`${SLUG}-loop`}
          duration={LOOP}
          drawAt={(ctx, t) => {
            const l = loopAt(t, v.speed);
            drawObject(ctx, size.w, size.h, frame(l.theta, l.orbit));
          }}
        />
      </div>
    </Actions>
  );

  return (
    <ControlsLayout controls={c} header={header}>
      <StageArea>
        <Stage
          width={size.w}
          height={size.h}
          label={`A spinning “Certified Motion Designer” medal for ${answers.handle || "you"}. Drag to spin.`}
          tick={(dt, now) => {
            clock.current = now;
            get().tick(dt, v.speed, reduced);
          }}
          draw={(ctx, w, h) => drawObject(ctx, w, h, frame(get().theta, get().orbit))}
          onPointer={(p) => {
            const s = get();
            if (p.type === "down") s.down(p.x, clock.current);
            else if (p.type === "move") s.move(p.x, clock.current, Math.min(size.w, size.h) * 0.3);
            else s.up();
          }}
          cursor={() => (get().dragging ? "grabbing" : "grab")}
        />
      </StageArea>
    </ControlsLayout>
  );
}
