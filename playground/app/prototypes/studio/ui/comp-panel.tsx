"use client";

import { ControlPanel, type Controls } from "@/components/controls";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { controls } from "../data";
import { useStudio } from "./context";
import { Section } from "./inspector";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex min-h-11 items-center justify-between gap-3 text-xs text-muted-foreground">
    {label}
    <div className="w-[55%]">{children}</div>
  </label>
);

/** With no layer selected: the composition (name, length, frame rate, background) and viewer prefs. */
export function CompPanel({ prefs }: { prefs: Controls<typeof controls> }) {
  const { project, update } = useStudio();
  return (
    <div className="flex flex-col gap-4 p-3">
      <Section title="Composition">
        <Row label="Name"><Input value={project.name} onChange={(e) => update({ ...project, name: e.target.value })} /></Row>
        <Row label="Length (s)">
          <Input type="number" min={0.5} max={120} step={0.5} value={project.duration}
            onChange={(e) => {
              const d = Math.max(0.5, Math.min(120, Number(e.target.value) || project.duration));
              update({ ...project, duration: d, layers: project.layers.map((l) => ({ ...l, outPoint: l.outPoint >= project.duration - 1e-6 ? d : Math.min(l.outPoint, d) })) });
            }} />
        </Row>
        <Row label="Frame rate">
          <NativeSelect value={String(project.fps)} onChange={(e) => update({ ...project, fps: Number(e.target.value) })} className="w-full">
            {[12, 24, 30, 60].map((f) => <NativeSelectOption key={f} value={f}>{f} fps</NativeSelectOption>)}
          </NativeSelect>
        </Row>
        <Row label="Background">
          <input type="color" aria-label="Background" value={project.background} onChange={(e) => update({ ...project, background: e.target.value })} className="h-8 w-full cursor-pointer rounded-md border border-input bg-transparent p-0.5" />
        </Row>
        <p className="text-xs text-muted-foreground">{project.width}×{project.height}</p>
      </Section>
      <Section title="View">
        <ControlPanel controls={prefs} />
      </Section>
    </div>
  );
}
