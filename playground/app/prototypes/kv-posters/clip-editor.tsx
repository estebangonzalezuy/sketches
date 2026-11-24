"use client";

import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { CurveEditor } from "@/lib/studio/ui/curve-editor";
import type { Ease } from "@/lib/studio/model/types";
import type { Clip, Effect } from "./types";

const EFFECTS: [Effect, string][] = [
  ["build", "KV build"],
  ["fade", "Fade"],
  ["rise", "Rise"],
  ["drop", "Drop"],
  ["slide", "Slide in"],
  ["scale", "Scale"],
  ["spin", "Spin in"],
];

/** Settings of the selected element's clip: effect, timing curve, back to automatic. */
export function ClipEditor({ name, clip, duration, custom, globalEase, onChange, onReset }: {
  name: string;
  clip: Clip;
  duration: number;
  custom: boolean;
  globalEase: Ease;
  onChange: (c: Clip, group?: string) => void;
  onReset: () => void;
}) {
  return (
    <section className="grid gap-3 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-sm font-medium">
          {name}
          <span className="ml-2 font-normal text-muted-foreground tabular-nums">
            {(clip.start * duration).toFixed(2)}–{(clip.end * duration).toFixed(2)}s
          </span>
        </h2>
        <Button variant="outline" size="icon" aria-label="Back to automatic timing" disabled={!custom} onClick={onReset} className="sm:w-auto sm:px-2.5">
          <RotateCcwIcon />
          <span className="hidden sm:inline">Auto</span>
        </Button>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="clip-effect">Effect</Label>
        <NativeSelect id="clip-effect" value={clip.effect} onChange={(e) => onChange({ ...clip, effect: e.target.value as Effect })}>
          {EFFECTS.map(([v, l]) => (
            <NativeSelectOption key={v} value={v}>
              {l}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Label className="flex min-h-11 items-center justify-between text-sm">
        Own easing
        <Switch checked={!!clip.ease} onCheckedChange={(on) => onChange({ ...clip, ease: on ? globalEase : undefined })} />
      </Label>
      {clip.ease && <CurveEditor value={clip.ease} mixed={false} onChange={(e) => onChange({ ...clip, ease: e }, "clip-ease")} />}
    </section>
  );
}
