"use client";

import { XIcon } from "lucide-react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { FORMATS, type FormatId } from "@/lib/kv/model";
import { demoProject } from "../model/demo";
import { ENVIRONMENTS } from "../model/environments";
import { useTabs } from "../use-workspace";
import type { Workspace } from "../workspace";

/** One tab per open project, as in Motion Builder; "+ New" starts a project in an environment. */
export function TabBar({ ws }: { ws: Workspace }) {
  const { tabs, active } = useTabs(ws);
  const { openTab, switchTab, closeTab } = ws;
  const create = (v: string) => {
    if (v.startsWith("kv:")) return openTab({ ...demoProject(v.slice(3) as FormatId), environment: "motion-now", name: `Motion, Now ${FORMATS[v.slice(3) as FormatId].label}` });
    openTab(ENVIRONMENTS.find((e) => e.id === v)!.create());
  };
  return (
    <div role="tablist" aria-label="Projects" className="flex items-end gap-1 overflow-x-auto border-b border-border px-2 pt-1.5">
      {tabs.map((t) => (
        <div key={t.id} className={cn("flex shrink-0 items-center rounded-t-md border border-b-0", t.id === active ? "border-border bg-muted" : "border-transparent")}>
          <button type="button" role="tab" aria-selected={t.id === active} onClick={() => switchTab(t.id)} className="flex min-h-11 max-w-44 items-center gap-1.5 truncate pl-3 text-sm lg:min-h-8">
            <span className="truncate">{t.name}</span>
            <span className="text-[10px] text-muted-foreground">{ENVIRONMENTS.find((e) => e.id === t.environment)?.name}</span>
          </button>
          <button type="button" aria-label={`Close ${t.name}`} onClick={() => closeTab(t.id)} className="flex size-11 items-center justify-center text-muted-foreground lg:size-8">
            <XIcon className="size-3.5" />
          </button>
        </div>
      ))}
      <NativeSelect aria-label="New project" size="sm" value="" onChange={(e) => create(e.target.value)} className="mb-1 shrink-0">
        <NativeSelectOption value="" disabled>+ New</NativeSelectOption>
        {(Object.keys(FORMATS) as FormatId[]).map((f) => <NativeSelectOption key={f} value={`kv:${f}`}>Motion, Now · {FORMATS[f].label}</NativeSelectOption>)}
        {ENVIRONMENTS.filter((e) => e.id !== "motion-now" && !e.id.startsWith("fx:")).map((e) => <NativeSelectOption key={e.id} value={e.id}>{e.name}</NativeSelectOption>)}
      </NativeSelect>
    </div>
  );
}
