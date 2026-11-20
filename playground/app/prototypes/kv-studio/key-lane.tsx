"use client";

import type { Clock } from "./clock";
import { KeyDiamond, Lane } from "./lane";
import type { Key } from "./types";

/**
 * One channel's keys on a time lane. Tap a key to select it (and jump there); drag it
 * sideways to retime it. Keys are 44px tap targets.
 */
export function KeyLane({
  label,
  labelClassName,
  keys,
  clock,
  selected,
  onSelect,
  onRetime,
}: {
  label: React.ReactNode;
  labelClassName?: string;
  keys: Key[];
  clock: Clock;
  selected: string | null;
  onSelect: (k: Key) => void;
  onRetime: (k: Key, t: number) => void;
}) {
  return (
    <Lane label={label} labelClassName={labelClassName} clock={clock}>
      {(timeAt) =>
        keys.map((k) => (
          <KeyDiamond
            key={k.id}
            t={k.t}
            duration={clock.duration}
            selected={selected === k.id}
            label={`Key at ${k.t.toFixed(2)}s`}
            onSelect={() => onSelect(k)}
            onDrag={(x) => onRetime(k, timeAt(x))}
          />
        ))
      }
    </Lane>
  );
}
