"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapse } from "@/components/motion/collapse";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Composition } from "@/lib/kv/model";
import { animatable, layerKeys } from "./animate";
import { autoMix } from "./auto-mix";
import { BehaviorRow } from "./behavior-row";
import { BEHAVIOR_KINDS, BEHAVIORS, LAYER_TYPE_LABEL } from "./data";
import { newId } from "./use-studio";
import type { Anim, Behavior, BehaviorKind } from "./types";

type Update = (fn: (a: Anim) => Anim, coalesce?: boolean) => void;

/**
 * Stack behaviors on layers; the Progress slider plays them all. With `layerId`, only that
 * layer's behaviors are listed (the inspector); Auto mix and Clear always act on the whole poster.
 */
export function MixPanel({ comp, anim, update, layerId }: { comp: Composition; anim: Anim; update: Update; layerId?: string }) {
  const keys = layerKeys(comp);
  // rows close first, then leave the mix, so the list never jumps
  const [closing, setClosing] = useState<Set<string>>(() => new Set());
  const setMix = (fn: (m: Behavior[]) => Behavior[], coalesce?: boolean) => update((a) => ({ ...a, mix: fn(a.mix) }), coalesce);
  const add = (layer: string, kind: BehaviorKind) =>
    setMix((m) => [...m, { id: newId(), layer, kind, dir: "up", amount: 1, start: 0, end: 0.5 }]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setMix(() => autoMix(comp, newId))}>
          Auto mix
        </Button>
        <Button variant="ghost" onClick={() => setMix(() => [])} disabled={!anim.mix.length}>
          Clear
        </Button>
      </div>
      {animatable(comp)
        .filter((l) => !layerId || l.id === layerId)
        .map((l) => {
        const key = keys.get(l.id)!;
        const mine = anim.mix.filter((b) => b.layer === key);
        return (
          <section key={l.id} className="flex flex-col gap-2 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm">{l.name}</span>
              <Badge variant="outline">{LAYER_TYPE_LABEL[l.type] ?? l.type}</Badge>
              <NativeSelect aria-label={`Add behavior to ${l.name}`} value="" onChange={(e) => add(key, e.target.value as BehaviorKind)}>
                <NativeSelectOption value="" disabled>
                  Add…
                </NativeSelectOption>
                {BEHAVIOR_KINDS.map((k) => (
                  <NativeSelectOption key={k} value={k}>
                    {BEHAVIORS[k].label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            {mine.map((b) => (
              <Collapse
                key={b.id}
                open={!closing.has(b.id)}
                onClosed={() => {
                  setMix((m) => m.filter((x) => x.id !== b.id));
                  setClosing((c) => new Set([...c].filter((id) => id !== b.id)));
                }}
              >
                <BehaviorRow
                  b={b}
                  onChange={(patch, coalesce) => setMix((m) => m.map((x) => (x.id === b.id ? { ...x, ...patch } : x)), coalesce)}
                  onRemove={() => setClosing((c) => new Set(c).add(b.id))}
                />
              </Collapse>
            ))}
          </section>
        );
      })}
    </div>
  );
}
