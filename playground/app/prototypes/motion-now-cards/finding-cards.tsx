"use client";

import { useRef, useState } from "react";
import { PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ControlsLayout, useControls } from "@/components/controls";
import { Actions, PngButton, RenderVideoButton } from "@/components/tmsc/export-actions";
import { Stage, StageArea } from "@/components/tmsc/stage";
import { usePersistent } from "@/components/tmsc/use-persistent";
import { useReducedMotion } from "@/components/tmsc/use-reduced-motion";
import { format } from "@/lib/tmsc/formats";
import { BatchSection } from "./batch-section";
import { drawCard } from "./card-render";
import { controls, DEFAULT_FINDING, EXAMPLE_FINDINGS, SLUG, VIDEO_DURATION } from "./data";
import { FindingForm } from "./finding-form";
import { sanitizeFinding, sanitizeFindings } from "./findings";

const DONE = 99;

export function FindingCards() {
  const c = useControls(SLUG, controls);
  const [finding, setFinding] = usePersistent(SLUG, "finding", DEFAULT_FINDING, sanitizeFinding);
  const [batch, setBatch, resetBatch] = usePersistent(SLUG, "batch", EXAMPLE_FINDINGS, sanitizeFindings);
  const [formKey, setFormKey] = useState(0);
  const reduced = useReducedMotion();
  const time = useRef(0);
  const size = format(c.values.format);
  const options = { background: c.values.background, tag: c.values.tag };
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => drawCard(ctx, w, h, finding, reduced ? DONE : time.current, options);

  const header = (
    <Actions>
      <Button onClick={() => (time.current = 0)}>
        <PlayIcon />
        Play
      </Button>
      <PngButton size={size} name={SLUG} draw={(ctx, w, h) => drawCard(ctx, w, h, finding, DONE, options)} />
      <RenderVideoButton size={size} name={SLUG} duration={VIDEO_DURATION} drawAt={(ctx, t) => drawCard(ctx, size.w, size.h, finding, t, options)} />
      <div className="mt-2">
        <FindingForm key={formKey} finding={finding} onChange={setFinding} />
      </div>
    </Actions>
  );
  const footer = (
    <BatchSection
      findings={batch}
      onApply={setBatch}
      onRestore={resetBatch}
      size={size}
      options={options}
      onLoad={(f) => {
        setFinding(f);
        setFormKey((k) => k + 1);
        time.current = 0;
      }}
    />
  );

  return (
    <ControlsLayout controls={c} header={header} footer={footer}>
      <StageArea>
        <Stage
          width={size.w}
          height={size.h}
          label={`Finding card: ${finding.number}${finding.unit} ${finding.sentence}`}
          tick={(dt) => (time.current = Math.min(DONE, time.current + dt))}
          draw={draw}
        />
      </StageArea>
    </ControlsLayout>
  );
}
