"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { EASE_LABELS } from "../model/ease";
import { allKeys, deleteKeys, setKeysEase, setKeyValue } from "../model/ops";
import { specOf } from "../model/specs";
import type { EaseName } from "../model/types";
import { useStudio } from "./context";
import { Section } from "./inspector";
import { control } from "./param-field";

/** The selected keyframes: easing for all of them, and the value when there's just one. */
export function KeysSection() {
  const { project, update, sel, setSel } = useStudio();
  const all = allKeys(project);
  const picked = [...sel.keys].map((id) => all.get(id)).filter((x) => !!x);
  if (!picked.length) return null;
  const eases = new Set(picked.map((p) => p.key.ease));
  const one = picked.length === 1 ? picked[0] : null;
  const layer = one && project.layers.find((l) => l.id === one.path.layer);
  const spec = one && layer ? specOf(layer, one.path) : undefined;

  return (
    <Section
      title={`${picked.length} key${picked.length > 1 ? "s" : ""}${one ? ` @ ${one.key.t.toFixed(2)}s` : ""}`}
      action={
        <Button size="icon-sm" variant="ghost" aria-label="Delete keys" className="size-11 lg:size-7" onClick={() => (update(deleteKeys(project, sel.keys)), setSel({ keys: new Set() }))}>
          <Trash2Icon />
        </Button>
      }
    >
      <div className="flex min-h-11 items-center justify-between gap-2 text-xs text-muted-foreground">
        Ease out of key
        <NativeSelect aria-label="Ease" size="sm" value={eases.size === 1 ? [...eases][0] : ""} onChange={(e) => update(setKeysEase(project, sel.keys, e.target.value as EaseName))}>
          {eases.size > 1 && <NativeSelectOption value="" disabled>Mixed</NativeSelectOption>}
          {(Object.keys(EASE_LABELS) as EaseName[]).map((k) => <NativeSelectOption key={k} value={k}>{EASE_LABELS[k]}</NativeSelectOption>)}
        </NativeSelect>
      </div>
      {one && spec && spec.kind !== "text" && (
        <div className="flex min-h-11 items-center justify-between gap-2 text-xs text-muted-foreground">
          {spec.label}
          <div className="flex w-[58%] items-center justify-end gap-1">
            {control(spec, one.key.v, (v) => update(setKeyValue(project, one.key.id, v)), spec.kind === "number" ? (spec.display ?? 1) : 1)}
          </div>
        </div>
      )}
    </Section>
  );
}
