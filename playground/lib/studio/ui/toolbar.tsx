"use client";

import { useRef } from "react";
import { ExternalLinkIcon, FileDownIcon, FileUpIcon, Redo2Icon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { newLayer, validateProject } from "../model/project";
import { entrance } from "../model/templates";
import { available } from "./available";
import { useStudio } from "./context";
import { ExportButton } from "./export-button";
import { sendToStudio } from "../handoff";

/** Top bar: animate the whole comp (Motion, Now), add a layer from the environment, open/save, undo, export. */
export function Toolbar() {
  const { project, update, setSel, clock, ws, handoff } = useStudio();
  const router = useRouter();
  const { env, gens } = available(project);
  const fileRef = useRef<HTMLInputElement>(null);

  const open = async (f: File) => {
    try {
      ws.openTab(validateProject(JSON.parse(await f.text())));
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
      {env.id === "motion-now" && (
        <Button size="sm" variant="outline" onClick={() => (update(entrance(project, clock.t)), clock.seek(0), clock.play())}>
          Animate all
        </Button>
      )}
      <NativeSelect aria-label="Add layer" size="sm" value="" onChange={(e) => {
        const l = newLayer(project, e.target.value);
        update({ ...project, layers: [...project.layers, l] });
        setSel({ layer: l.id, effect: null, keys: new Set() });
      }}>
        <NativeSelectOption value="" disabled>Add layer…</NativeSelectOption>
        {gens.map((g) => <NativeSelectOption key={g.id} value={g.id}>{g.name}</NativeSelectOption>)}
      </NativeSelect>
      <div className="ml-auto flex items-center gap-0.5">
        <Button size="icon" variant="ghost" aria-label="Open project" onClick={() => fileRef.current?.click()}><FileUpIcon /></Button>
        <Button size="icon" variant="ghost" aria-label="Save project" onClick={save}><FileDownIcon /></Button>
        <Button size="icon" variant="ghost" aria-label="Undo (⌘Z)" onClick={() => ws.undo(-1)}><Undo2Icon /></Button>
        <Button size="icon" variant="ghost" aria-label="Redo (⇧⌘Z)" onClick={() => ws.undo(1)}><Redo2Icon /></Button>
        {handoff && (
          <Button size="icon" variant="outline" aria-label="Open in Studio" className="sm:w-auto sm:px-2.5" onClick={() => sendToStudio(project, router)}>
            <ExternalLinkIcon />
            <span className="hidden sm:inline">Open in Studio</span>
          </Button>
        )}
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
