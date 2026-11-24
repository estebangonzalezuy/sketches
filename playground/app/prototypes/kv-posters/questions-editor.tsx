"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Questions } from "./questions";

/** The survey questions construct types into the boxes: one per line, plus the headline's lead question. */
export function QuestionsEditor({ value, onChange }: { value: Questions; onChange: (q: Questions) => void }) {
  return (
    <section className="grid gap-3 rounded-md border border-border p-3">
      <h2 className="text-sm font-medium">Survey questions</h2>
      <div className="grid gap-2">
        <Label htmlFor="q-lead">Headline question</Label>
        <Input id="q-lead" value={value.lead} onChange={(e) => onChange({ ...value, lead: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="q-list">Questions, one per line ({value.list.filter((s) => s.trim()).length})</Label>
        <Textarea id="q-list" rows={8} value={value.list.join("\n")} onChange={(e) => onChange({ ...value, list: e.target.value.split("\n") })} />
      </div>
    </section>
  );
}
