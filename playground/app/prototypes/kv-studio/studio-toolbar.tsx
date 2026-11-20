"use client";

import { Redo2Icon, Undo2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FORMATS, type Composition, type FormatId } from "@/lib/kv/model";
import { FORMAT_IDS } from "./data";
import { ExportButton } from "./export-button";
import { SourceMenu } from "./source-menu";
import { stepHistory } from "./store";
import type { PosterSource } from "./use-studio";
import type { Anim } from "./types";

/** The editor's top bar, as in the KV Editor: poster source, formats, undo, export. */
export function StudioToolbar({
  wide,
  source,
  setSource,
  format,
  setFormat,
  comp,
  anim,
  duration,
  fps,
}: {
  wide: boolean;
  source: PosterSource;
  setSource: (s: PosterSource) => void;
  format: FormatId;
  setFormat: (f: FormatId) => void;
  comp: Composition;
  anim: Anim;
  duration: number;
  fps: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 lg:flex-nowrap lg:py-0">
      <SourceMenu source={source} onChange={setSource} />
      {wide ? (
        <ToggleGroup type="single" value={format} onValueChange={(v) => v && setFormat(v as FormatId)} variant="outline" size="sm" className="mx-auto" aria-label="Format">
          {FORMAT_IDS.map((f) => (
            <ToggleGroupItem key={f} value={f} title={`${FORMATS[f].width}×${FORMATS[f].height}`} className="px-3">
              {FORMATS[f].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : (
        <NativeSelect aria-label="Format" value={format} onChange={(e) => setFormat(e.target.value as FormatId)}>
          {FORMAT_IDS.map((f) => (
            <NativeSelectOption key={f} value={f}>
              {FORMATS[f].label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}
      <div className="ml-auto flex items-center gap-1">
        <Button size="icon" variant="ghost" aria-label="Undo (⌘Z)" onClick={() => stepHistory("anim", -1)}>
          <Undo2Icon />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Redo (⇧⌘Z)" onClick={() => stepHistory("anim", 1)}>
          <Redo2Icon />
        </Button>
        <ExportButton comp={comp} anim={anim} duration={duration} fps={fps} />
      </div>
    </div>
  );
}
