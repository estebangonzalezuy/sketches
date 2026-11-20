"use client";

import { ChevronRightIcon } from "lucide-react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { BehaviorBar } from "./behavior-bar";
import type { Clock } from "./clock";
import { BEHAVIORS, PROP_IDS, PROPS } from "./data";
import { KeyLane } from "./key-lane";
import { KeyDiamond, Lane } from "./lane";
import type { Behavior, Key, Prop, Track } from "./types";

export type Selection = { kind: "key"; id: string } | { kind: "behavior"; id: string } | null;

/**
 * A layer in the timeline. Collapsed: one row with all its keys and behavior windows.
 * Expanded: a row per keyed channel and per behavior, plus "Key…" to key a channel at the playhead.
 */
export function TimelineLayer({
  name,
  current,
  onPick,
  open,
  onToggle,
  tracks,
  mix,
  clock,
  sel,
  setSel,
  addKey,
  retimeKey,
  changeBehavior,
  labelClassName,
}: {
  name: string;
  current: boolean;
  onPick: () => void;
  open: boolean;
  onToggle: () => void;
  tracks: Track[];
  mix: Behavior[];
  clock: Clock;
  sel: Selection;
  setSel: (s: Selection) => void;
  addKey: (prop: Prop) => void;
  retimeKey: (k: Key, t: number) => void;
  changeBehavior: (id: string, patch: Partial<Behavior>, coalesce?: boolean) => void;
  labelClassName: string;
}) {
  const d = clock.duration;
  const pickKey = (k: Key) => (setSel({ kind: "key", id: k.id }), clock.pause(), clock.seek(k.t));
  const isKey = (id: string) => sel?.kind === "key" && sel.id === id;
  const toggle = (
    <div className="flex items-center">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${name}`} className="flex size-11 shrink-0 items-center justify-center -ml-3">
        <ChevronRightIcon className={cn("size-3.5 transition-transform duration-200 ease-out-smooth", open && "rotate-90")} />
      </button>
      <button type="button" onClick={onPick} aria-pressed={current} className={cn("min-h-11 min-w-0 flex-1 truncate text-left", current ? "font-medium text-foreground" : "text-muted-foreground")}>
        {name}
      </button>
    </div>
  );

  return (
    <div className={cn("border-t border-border", current && "bg-muted/40")}>
      <Lane label={toggle} labelClassName={labelClassName} clock={clock}>
        {() => (
          <>
            {mix.map((b, i) => (
              <div
                key={b.id}
                className="pointer-events-none absolute h-1 rounded-full bg-muted-foreground/40"
                style={{ left: `${b.start * 100}%`, width: `${(b.end - b.start) * 100}%`, top: `${6 + (i % 4) * 5}px` }}
              />
            ))}
            {tracks.flatMap((tr) =>
              tr.keys.map((k) => (
                <KeyDiamond key={k.id} t={k.t} duration={d} selected={isKey(k.id)} label={`${PROPS[tr.prop].label} key at ${k.t.toFixed(2)}s`} onSelect={() => pickKey(k)} />
              )),
            )}
          </>
        )}
      </Lane>
      {open && (
        <div className="pb-2">
          {tracks.map((tr) => (
            <KeyLane
              key={tr.prop}
              label={<span className="pl-5">{PROPS[tr.prop].label}</span>}
              labelClassName={labelClassName}
              keys={tr.keys}
              clock={clock}
              selected={sel?.kind === "key" ? sel.id : null}
              onSelect={pickKey}
              onRetime={retimeKey}
            />
          ))}
          {mix.map((b) => (
            <Lane key={b.id} label={<span className="pl-5">{BEHAVIORS[b.kind].label}</span>} labelClassName={labelClassName} clock={clock}>
              {(timeAt) => (
                <BehaviorBar
                  b={b}
                  duration={d}
                  timeAt={timeAt}
                  selected={sel?.kind === "behavior" && sel.id === b.id}
                  onSelect={() => setSel({ kind: "behavior", id: b.id })}
                  onChange={(patch, coalesce) => changeBehavior(b.id, patch, coalesce)}
                />
              )}
            </Lane>
          ))}
          <div className="flex items-center gap-2 pl-5">
            <NativeSelect aria-label={`Key a channel of ${name} at the playhead`} value="" onChange={(e) => addKey(e.target.value as Prop)} size="sm">
              <NativeSelectOption value="" disabled>
                Key…
              </NativeSelectOption>
              {PROP_IDS.map((p) => (
                <NativeSelectOption key={p} value={p}>
                  {PROPS[p].label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>
      )}
    </div>
  );
}
