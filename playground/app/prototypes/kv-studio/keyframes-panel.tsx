"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Composition } from "@/lib/kv/model";
import { animatable, layerKeys } from "./animate";
import type { Clock } from "./clock";
import { PROP_IDS, PROPS } from "./data";
import { KeyEditor } from "./key-editor";
import { KeyLane } from "./key-lane";
import { evaluateTrack, removeKey, REST, updateKey, upsertKey } from "./tracks";
import { newId } from "./use-studio";
import type { Anim, Prop, Track } from "./types";

type Update = (fn: (a: Anim) => Anim, coalesce?: boolean) => void;

/** Per-layer keyframes: pick a layer and a channel, key it at the playhead, then shape the keys. */
export function KeyframesPanel({ comp, anim, update, clock, fps }: { comp: Composition; anim: Anim; update: Update; clock: Clock; fps: number }) {
  const layers = animatable(comp);
  const keys = layerKeys(comp);
  const [layerId, setLayerId] = useState(layers[0]?.id ?? "");
  const [prop, setProp] = useState<Prop>("dy");
  const [sel, setSel] = useState<string | null>(null);
  const layer = layers.find((l) => l.id === layerId) ?? layers[0];
  if (!layer) return null;
  const key = keys.get(layer.id)!;
  const tracks = anim.tracks.filter((tr) => tr.layer === key);
  const setTracks = (fn: (t: Track[]) => Track[], coalesce?: boolean) => update((a) => ({ ...a, tracks: fn(a.tracks) }), coalesce);
  const selTrack = tracks.find((tr) => tr.keys.some((k) => k.id === sel));
  const selKey = selTrack?.keys.find((k) => k.id === sel);

  const addKey = () => {
    const tr = tracks.find((x) => x.prop === prop);
    const v = tr ? evaluateTrack(tr.keys, clock.t, REST[prop]) : REST[prop];
    const k = { id: newId(), t: clock.t, v, ease: "out" as const };
    setTracks((all) => upsertKey(all, key, prop, k, 0.5 / fps));
    setSel(k.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect aria-label="Layer" value={layer.id} onChange={(e) => (setLayerId(e.target.value), setSel(null))} className="min-w-0 flex-1">
          {layers.map((l) => (
            <NativeSelectOption key={l.id} value={l.id}>
              {l.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Channel" value={prop} onChange={(e) => setProp(e.target.value as Prop)}>
          {PROP_IDS.map((p) => (
            <NativeSelectOption key={p} value={p}>
              {PROPS[p].label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button variant="secondary" onClick={addKey} aria-label="Key at playhead">
          <PlusIcon />
          Key
        </Button>
      </div>
      {tracks.map((tr) => (
        <KeyLane
          key={tr.prop}
          label={PROPS[tr.prop].label}
          keys={tr.keys}
          clock={clock}
          selected={sel}
          onSelect={(k) => (setSel(k.id), clock.pause(), clock.seek(k.t))}
          onRetime={(k, t) => {
            const snapped = Math.round(t * fps) / fps;
            setTracks((all) => updateKey(all, k.id, { t: snapped }), true);
            clock.seek(snapped);
          }}
        />
      ))}
      {selKey && selTrack && (
        <KeyEditor
          k={selKey}
          prop={selTrack.prop}
          onChange={(patch, coalesce) => setTracks((all) => updateKey(all, selKey.id, patch), coalesce)}
          onRemove={() => (setTracks((all) => removeKey(all, selKey.id)), setSel(null))}
        />
      )}
    </div>
  );
}
