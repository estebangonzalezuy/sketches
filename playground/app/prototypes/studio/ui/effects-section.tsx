"use client";

import { ArrowDownIcon, ArrowUpIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { mapLayer } from "../model/paths";
import { newEffect } from "../model/project";
import type { EffectInstance, Layer } from "../model/types";
import { EFFECTS } from "../tools/registry";
import { useStudio } from "./context";
import { Section } from "./inspector";
import { ParamField } from "./param-field";

/**
 * The layer's effect stack, top runs first. Mix them freely: vector effects (Corner Pin,
 * Pixel, Radial Warp) bend contours; GL ones (Wave) work on the bitmap after them.
 */
export function EffectsSection({ layer: l }: { layer: Layer }) {
  const { project, update, sel, setSel } = useStudio();
  const setFx = (fn: (fx: EffectInstance[]) => EffectInstance[]) => update(mapLayer(project, l.id, (x) => ({ ...x, effects: fn(x.effects) })));
  const move = (i: number, d: number) =>
    setFx((fx) => {
      const a = [...fx];
      const [it] = a.splice(i, 1);
      a.splice(Math.max(0, Math.min(a.length, i + d)), 0, it);
      return a;
    });

  return (
    <Section
      title="Effects"
      action={
        <NativeSelect aria-label="Add effect" size="sm" value="" onChange={(e) => {
          const fx = newEffect(e.target.value);
          setFx((a) => [...a, fx]);
          setSel({ effect: fx.id });
        }}>
          <NativeSelectOption value="" disabled>Add effect…</NativeSelectOption>
          {Object.values(EFFECTS).map((d) => <NativeSelectOption key={d.id} value={d.id}>{d.name}</NativeSelectOption>)}
        </NativeSelect>
      }
    >
      {l.effects.map((fx, i) => {
        const def = EFFECTS[fx.tool];
        return (
          <div key={fx.id} className={cn("mt-2 rounded-md border p-2", sel.effect === fx.id ? "border-primary" : "border-border")} onPointerDown={() => sel.effect !== fx.id && setSel({ effect: fx.id })}>
            <div className="flex items-center gap-1">
              <Switch aria-label={`Enable ${def?.name}`} checked={fx.enabled} onCheckedChange={(on) => setFx((a) => a.map((x) => (x.id === fx.id ? { ...x, enabled: on } : x)))} />
              <span className="min-w-0 flex-1 truncate pl-1 text-sm">{def?.name ?? fx.tool}</span>
              <Button size="icon-sm" variant="ghost" aria-label="Move effect up" className="size-11 lg:size-7" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpIcon /></Button>
              <Button size="icon-sm" variant="ghost" aria-label="Move effect down" className="size-11 lg:size-7" disabled={i === l.effects.length - 1} onClick={() => move(i, 1)}><ArrowDownIcon /></Button>
              <Button size="icon-sm" variant="ghost" aria-label="Remove effect" className="size-11 lg:size-7" onClick={() => setFx((a) => a.filter((x) => x.id !== fx.id))}><XIcon /></Button>
            </div>
            {def && Object.entries(def.params).map(([k, s]) => (
              <ParamField key={k} path={{ layer: l.id, group: "effect", effect: fx.id, param: k }} spec={s} track={fx.params[k]} />
            ))}
          </div>
        );
      })}
    </Section>
  );
}
