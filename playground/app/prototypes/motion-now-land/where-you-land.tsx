"use client";

import { useMemo, useRef } from "react";
import { ControlsLayout, useControls } from "@/components/controls";
import { Actions, LiveRecordButton, PngButton } from "@/components/tmsc/export-actions";
import { RespondentsEditor, useRespondents } from "@/components/tmsc/respondents";
import { Stage, StageArea } from "@/components/tmsc/stage";
import { TextField } from "@/components/tmsc/text-field";
import { useLiveRecording } from "@/components/tmsc/use-live-recording";
import { usePersistent } from "@/components/tmsc/use-persistent";
import { useReducedMotion } from "@/components/tmsc/use-reduced-motion";
import { format } from "@/lib/tmsc/formats";
import { controls, DEFAULT_INPUT, SLUG } from "./data";
import { drawLand } from "./draw";
import { land, sentence } from "./land";
import { LandScene } from "./scene";

const sanitizeInput = (raw: unknown) => {
  const r = raw as Partial<typeof DEFAULT_INPUT> | null;
  return r && typeof r.rate === "string" && typeof r.years === "string" ? { rate: r.rate, years: r.years } : undefined;
};

export function WhereYouLand() {
  const c = useControls(SLUG, controls);
  const v = c.values;
  const data = useRespondents(SLUG);
  const reduced = useReducedMotion();
  const size = format(v.format);
  const [input, setInput] = usePersistent(SLUG, "input", DEFAULT_INPUT, sanitizeInput);
  const rec = useLiveRecording(size, SLUG);
  const scene = useRef<LandScene>(null);

  const isRate = v.metric === "Day rate";
  const raw = Number((isRate ? input.rate : input.years).replace(/[^\d.]/g, ""));
  const you = (isRate ? input.rate : input.years).trim() && Number.isFinite(raw) ? raw : null;
  const filters = { role: v.role, years: v.years, mode: v.mode };
  const landing = useMemo(
    () => land(data.people, { role: v.role, years: v.years, mode: v.mode }, v.metric, v.currency, you),
    [data.people, v.role, v.years, v.mode, v.metric, v.currency, you],
  );
  const text = sentence(landing, filters, v.metric);
  const view = { palette: v.palette, metric: v.metric, currency: v.currency, n: landing.n };
  const get = () => (scene.current ??= new LandScene());
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => drawLand(ctx, w, h, get(), view);

  const field = isRate ? (
    <TextField label={`Your day rate (${v.currency})`} value={input.rate} inputMode="decimal" onChange={(rate) => setInput({ ...input, rate })} />
  ) : (
    <TextField label="Your years of experience" value={input.years} inputMode="numeric" onChange={(years) => setInput({ ...input, years })} />
  );

  const header = (
    <Actions>
      {field}
      <div className="mt-2 grid gap-2">
        <PngButton size={size} name={SLUG} draw={draw} />
        <LiveRecordButton recording={rec.recording} onToggle={rec.toggle} />
      </div>
    </Actions>
  );

  return (
    <ControlsLayout controls={c} header={header} footer={<RespondentsEditor data={data} />}>
      <StageArea>
        <Stage
          width={size.w}
          height={size.h}
          label={text || "Where do you land: enter your day rate or years of experience"}
          recorder={rec.recorder}
          tick={(dt, now) => {
            const sc = get();
            sc.now = now;
            sc.update(landing, text, v.metric, reduced);
            sc.tick(dt, now, reduced);
          }}
          draw={draw}
        />
        {/* the one input that matters stays in reach on phones, outside the sheet */}
        <div className="mt-4 w-full max-w-sm lg:hidden">{field}</div>
      </StageArea>
    </ControlsLayout>
  );
}
