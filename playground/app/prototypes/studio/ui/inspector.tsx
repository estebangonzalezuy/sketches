"use client";

import { ArrowDownIcon, ArrowUpIcon, CopyIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { mapLayer } from "../model/paths";
import { uid } from "../model/ops";
import { TRANSFORM_SPECS } from "../model/transform-specs";
import type { Blend, Layer, TransformTracks } from "../model/types";
import { GENERATORS } from "../tools/registry";
import { useStudio } from "./context";
import { EffectsSection } from "./effects-section";
import { KeysSection } from "./keys-section";
import { ParamField } from "./param-field";

const BLENDS: { value: Blend; label: string }[] = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "difference", label: "Difference" },
];

/** The selected layer: name and blend, selected keys, transform, contents, then its effect stack. */
export function Inspector() {
  const { project, update, sel, setSel } = useStudio();
  const l = project.layers.find((x) => x.id === sel.layer);
  if (!l) return <p className="p-4 text-sm text-muted-foreground">Select a layer in the viewport or the timeline.</p>;
  const gen = GENERATORS[l.tool];
  const patch = (fn: (x: Layer) => Layer, history = true) => update(mapLayer(project, l.id, fn), history);
  const i = project.layers.indexOf(l);
  /** +1 brings the layer forward (up the timeline), -1 sends it back. */
  const restack = (d: number) => {
    const a = [...project.layers];
    a.splice(i, 1);
    a.splice(Math.max(0, Math.min(a.length, i + d)), 0, l);
    update({ ...project, layers: a });
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-1">
        <Input aria-label="Layer name" value={l.name} onChange={(e) => patch((x) => ({ ...x, name: e.target.value }))} className="min-w-0 flex-1" />
        <Button size="icon" variant="ghost" aria-label="Bring forward" disabled={i === project.layers.length - 1} onClick={() => restack(1)}><ArrowUpIcon /></Button>
        <Button size="icon" variant="ghost" aria-label="Send backward" disabled={i === 0} onClick={() => restack(-1)}><ArrowDownIcon /></Button>
        <Button size="icon" variant="ghost" aria-label="Duplicate layer"
          onClick={() => {
            const copy = { ...structuredClone(l), id: uid("l"), name: `${l.name} copy`, effects: l.effects.map((e) => ({ ...structuredClone(e), id: uid("e") })) };
            update({ ...project, layers: [...project.layers.slice(0, i + 1), copy, ...project.layers.slice(i + 1)] });
            setSel({ layer: copy.id, keys: new Set() });
          }}>
          <CopyIcon />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Delete layer"
          onClick={() => (update({ ...project, layers: project.layers.filter((x) => x.id !== l.id) }), setSel({ layer: null, effect: null, keys: new Set() }))}>
          <Trash2Icon />
        </Button>
      </div>
      <div className="flex min-h-11 items-center justify-between gap-2 text-xs text-muted-foreground">
        {gen?.name}
        <NativeSelect aria-label="Blend mode" size="sm" value={l.blend} onChange={(e) => patch((x) => ({ ...x, blend: e.target.value as Blend }))}>
          {BLENDS.map((b) => <NativeSelectOption key={b.value} value={b.value}>{b.label}</NativeSelectOption>)}
        </NativeSelect>
      </div>
      {sel.keys.size > 0 && <KeysSection />}
      <Section title="Transform">
        {(Object.keys(TRANSFORM_SPECS) as (keyof TransformTracks)[]).map((k) => (
          <ParamField key={k} path={{ layer: l.id, group: "transform", param: k }} spec={TRANSFORM_SPECS[k]} track={l.transform[k]} />
        ))}
      </Section>
      {gen && Object.entries(gen.params).some(([, s]) => !s.hidden) && (
        <Section title="Contents">
          {Object.entries(gen.params).map(([k, s]) =>
            s.hidden ? null : <ParamField key={k} path={{ layer: l.id, group: "params", param: k }} spec={s} track={l.params[k]} />,
          )}
        </Section>
      )}
      <EffectsSection layer={l} />
    </div>
  );
}

export function Section({ title, children, action }: { title: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="flex flex-col border-t border-border pt-2">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <h3 className="text-xs font-medium">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
