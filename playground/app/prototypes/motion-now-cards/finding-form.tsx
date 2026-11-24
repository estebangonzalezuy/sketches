"use client";

import { useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { TextField } from "@/components/tmsc/text-field";
import { CHAPTER_NAMES, type ChapterName } from "@/lib/tmsc/palettes";
import { parseList } from "./findings";
import { CHART_TYPES, type ChartType, type Finding } from "./types";

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
      <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <NativeSelectOption key={o} value={o}>
            {o}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

/** The finding's own inputs. Remount (key) to load a different finding. */
export function FindingForm({ finding, onChange }: { finding: Finding; onChange: (f: Finding) => void }) {
  const sentenceId = useId();
  const [dataText, setDataText] = useState(finding.data.join(", "));
  const [nText, setNText] = useState(String(finding.n));
  const set = (patch: Partial<Finding>) => onChange({ ...finding, ...patch });

  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4">
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Number" value={finding.number} onChange={(v) => set({ number: v.slice(0, 12) })} inputMode="decimal" />
        <TextField label="Unit" value={finding.unit} onChange={(v) => set({ unit: v.slice(0, 12) })} placeholder="%, $, ×" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={sentenceId} className="font-normal">
          Sentence
        </Label>
        <Textarea id={sentenceId} value={finding.sentence} maxLength={220} onChange={(e) => set({ sentence: e.target.value })} />
      </div>
      <Select label="Chart" value={finding.chart} options={CHART_TYPES} onChange={(chart: ChartType) => set({ chart })} />
      <TextField
        label="Chart data"
        value={dataText}
        placeholder="12, 40, 7"
        onChange={(v) => {
          setDataText(v);
          set({ data: parseList(v) });
        }}
      />
      <Select label="Chapter" value={finding.chapter} options={CHAPTER_NAMES} onChange={(chapter: ChapterName) => set({ chapter })} />
      <TextField
          label="Sample size n="
          value={nText}
          inputMode="numeric"
          onChange={(v) => {
            setNText(v);
            const n = Math.round(Number(v));
            if (n > 0) set({ n });
        }}
      />
    </div>
  );
}
