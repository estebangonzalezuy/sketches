"use client";

import { useState } from "react";
import type { Composition } from "@/lib/kv/model";
import { animatable, layerKeys } from "./animate";
import { BehaviorRow } from "./behavior-row";
import type { Clock } from "./clock";
import { KeyEditor } from "./key-editor";
import { TimelineLayer, type Selection } from "./timeline-layer";
import { TimelineRuler } from "./timeline-ruler";
import { evaluateTrack, removeKey, REST, updateKey, upsertKey } from "./tracks";
import { newId } from "./use-studio";
import type { Anim, Behavior, Prop, Track } from "./types";

type Update = (fn: (a: Anim) => Anim, coalesce?: boolean) => void;
const LABEL = "w-24 sm:w-32";

/** The classic timeline: every layer as a row on one time ruler, keys and behavior windows together. */
export function TimelinePanel({
  comp,
  anim,
  update,
  clock,
  fps,
  layerId,
  onSelectLayer,
}: {
  comp: Composition;
  anim: Anim;
  update: Update;
  clock: Clock;
  fps: number;
  layerId: string;
  onSelectLayer: (id: string) => void;
}) {
  const keys = layerKeys(comp);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [sel, setSel] = useState<Selection>(null);
  const setTracks = (fn: (t: Track[]) => Track[], coalesce?: boolean) => update((a) => ({ ...a, tracks: fn(a.tracks) }), coalesce);
  const setMix = (fn: (m: Behavior[]) => Behavior[], coalesce?: boolean) => update((a) => ({ ...a, mix: fn(a.mix) }), coalesce);
  const snapT = (t: number) => Math.round(t * fps) / fps;

  const selTrack = sel?.kind === "key" ? anim.tracks.find((tr) => tr.keys.some((k) => k.id === sel.id)) : undefined;
  const selKey = selTrack?.keys.find((k) => sel?.kind === "key" && k.id === sel.id);
  const selBehavior = sel?.kind === "behavior" ? anim.mix.find((b) => b.id === sel.id) : undefined;

  return (
    <div className="flex flex-col">
      {/* the ruler stays in view while layers scroll under it (below the prototype bar on phones) */}
      <div className="sticky top-[calc(3rem+1px)] z-20 bg-background lg:top-0">
        <TimelineRuler clock={clock} labelClassName={LABEL} />
      </div>
      {animatable(comp).map((l) => {
        const key = keys.get(l.id)!;
        const addKey = (prop: Prop) => {
          const t = snapT(clock.t);
          const tr = anim.tracks.find((x) => x.layer === key && x.prop === prop);
          const k = { id: newId(), t, v: tr ? evaluateTrack(tr.keys, t, REST[prop]) : REST[prop], ease: "out" as const };
          setTracks((all) => upsertKey(all, key, prop, k, 0.5 / fps));
          setSel({ kind: "key", id: k.id });
        };
        return (
          <TimelineLayer
            key={l.id}
            name={l.name}
            current={l.id === layerId}
            onPick={() => onSelectLayer(l.id)}
            open={open.has(l.id)}
            onToggle={() => setOpen((s) => (s.has(l.id) ? new Set([...s].filter((x) => x !== l.id)) : new Set(s).add(l.id)))}
            tracks={anim.tracks.filter((tr) => tr.layer === key)}
            mix={anim.mix.filter((b) => b.layer === key)}
            clock={clock}
            sel={sel}
            setSel={setSel}
            addKey={addKey}
            retimeKey={(k, t) => {
              setTracks((all) => updateKey(all, k.id, { t: snapT(t) }), true);
              clock.seek(snapT(t));
            }}
            changeBehavior={(id, patch, coalesce) => setMix((m) => m.map((b) => (b.id === id ? { ...b, ...patch } : b)), coalesce)}
            labelClassName={LABEL}
          />
        );
      })}
      <div className="sticky bottom-0 bg-background pt-3 empty:hidden">
        {selKey && selTrack && (
          <KeyEditor
            k={selKey}
            prop={selTrack.prop}
            onChange={(patch, coalesce) => setTracks((all) => updateKey(all, selKey.id, patch), coalesce)}
            onRemove={() => (setTracks((all) => removeKey(all, selKey.id)), setSel(null))}
          />
        )}
        {selBehavior && (
          <BehaviorRow
            b={selBehavior}
            onChange={(patch, coalesce) => setMix((m) => m.map((b) => (b.id === selBehavior.id ? { ...b, ...patch } : b)), coalesce)}
            onRemove={() => (setMix((m) => m.filter((b) => b.id !== selBehavior.id)), setSel(null))}
          />
        )}
      </div>
    </div>
  );
}
