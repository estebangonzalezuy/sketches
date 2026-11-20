"use client";

import { useRef } from "react";
import { FileDownIcon, FileUpIcon, Redo2Icon, Undo2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { FORMATS, type FormatId } from "@/lib/kv/model";
import { demoProject } from "../model/demo";
import { newLayer, validateProject } from "../model/project";
import { undo } from "../store";
import { ADDABLE_GENERATORS } from "../tools/registry";
import { useStudio } from "./context";
import { ExportButton } from "./export-button";

/** Top bar: new Motion, Now comp per format, open/save the project, add a layer, undo, export. */
export function Toolbar() {
  const { project, update, setSel, clock } = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);

  const open = async (f: File) => {
    try {
      update(validateProject(JSON.parse(await f.text())));
      setSel({ layer: null, effect: null, keys: new Set() });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't open that file.");
    }
  };
  const save = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(project)], { type: "application/json" }));
    a.download = `${project.name || "studio"}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-1.5">
      <NativeSelect aria-label="New Motion, Now comp" size="sm" value="" onChange={(e) => {
        update(demoProject(e.target.value as FormatId));
        setSel({ layer: null, effect: null, keys: new Set() });
        clock.seek(0);
      }}>
        <NativeSelectOption value="" disabled>New KV comp…</NativeSelectOption>
        {(Object.keys(FORMATS) as FormatId[]).map((f) => <NativeSelectOption key={f} value={f}>{FORMATS[f].label}</NativeSelectOption>)}
      </NativeSelect>
      <NativeSelect aria-label="Add layer" size="sm" value="" onChange={(e) => {
        const l = newLayer(project, e.target.value);
        update({ ...project, layers: [...project.layers, l] });
        setSel({ layer: l.id, effect: null, keys: new Set() });
      }}>
        <NativeSelectOption value="" disabled>Add layer…</NativeSelectOption>
        {ADDABLE_GENERATORS.map((g) => <NativeSelectOption key={g.id} value={g.id}>{g.name}</NativeSelectOption>)}
      </NativeSelect>
      <div className="ml-auto flex items-center gap-0.5">
        <Button size="icon" variant="ghost" aria-label="Open project" onClick={() => fileRef.current?.click()}><FileUpIcon /></Button>
        <Button size="icon" variant="ghost" aria-label="Save project" onClick={save}><FileDownIcon /></Button>
        <Button size="icon" variant="ghost" aria-label="Undo (⌘Z)" onClick={() => undo(-1)}><Undo2Icon /></Button>
        <Button size="icon" variant="ghost" aria-label="Redo (⇧⌘Z)" onClick={() => undo(1)}><Redo2Icon /></Button>
        <ExportButton />
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) void open(f);
        e.target.value = "";
      }} />
    </div>
  );
}
