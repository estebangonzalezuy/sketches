"use client";

import { useState } from "react";
import { ChevronRightIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { cn } from "cn";
import { Collapse } from "@/components/motion/collapse";
import { Button } from "@/components/ui/button";
import { evalCurve, removeKey } from "./curve";
import { CurveEditor } from "./curve-editor";
import type { CurveMeta, Key } from "./types";

/** A parameter whose value changes over t: name and live value, expands to its graph. */
export function CurveRow({
  meta,
  keys,
  t,
  open,
  onToggle,
  onChange,
  onReset,
}: {
  meta: CurveMeta;
  keys: Key[];
  t: number;
  open: boolean;
  onToggle: () => void;
  onChange: (keys: Key[]) => void;
  onReset: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const selected = picked !== null && picked < keys.length ? picked : null;
  const key = selected !== null ? keys[selected] : null;
  const removable = selected !== null && selected > 0 && selected < keys.length - 1;

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm"
      >
        <ChevronRightIcon className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-90")} />
        {meta.label}
        <span className="ml-auto font-mono text-muted-foreground tabular-nums">{evalCurve(keys, t).toFixed(2)}</span>
      </button>
      <Collapse open={open}>
        <div className="px-3 pb-3">
          <CurveEditor meta={meta} keys={keys} t={t} selected={selected} onSelect={setPicked} onChange={onChange} />
          <div className="mt-2 flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <span className="tabular-nums">
              {key ? `t ${key.t.toFixed(2)} → ${key.v.toFixed(2)}` : `${keys.length} points`}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove point"
              disabled={!removable}
              onClick={() => {
                if (selected === null) return;
                onChange(removeKey(keys, selected));
                setPicked(null);
              }}
              className="ml-auto sm:w-auto sm:px-2"
            >
              <Trash2Icon />
              <span className="hidden sm:inline">Remove point</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Reset ${meta.label}`}
              onClick={() => {
                onReset();
                setPicked(null);
              }}
              className="sm:w-auto sm:px-2"
            >
              <RotateCcwIcon />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </div>
      </Collapse>
    </div>
  );
}
