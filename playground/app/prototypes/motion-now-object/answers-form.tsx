"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { TextField } from "@/components/tmsc/text-field";
import { ROLES } from "@/lib/tmsc/survey";
import { EASINGS, type Answers, type EasingName } from "./data";

function Row<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
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

export function AnswersForm({ answers, onChange }: { answers: Answers; onChange: (a: Answers) => void }) {
  const set = (patch: Partial<Answers>) => onChange({ ...answers, ...patch });
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4">
      <TextField label="Name or handle" value={answers.handle} onChange={(handle) => set({ handle: handle.slice(0, 24) })} />
      <Row label="Role" value={answers.role} options={ROLES} onChange={(role) => set({ role })} />
      <TextField label="Years in motion" value={answers.years} inputMode="numeric" onChange={(years) => set({ years: years.replace(/\D/g, "").slice(0, 2) })} />
      <Row label="Favorite easing" value={answers.easing} options={Object.keys(EASINGS) as EasingName[]} onChange={(easing) => set({ easing })} />
    </div>
  );
}
