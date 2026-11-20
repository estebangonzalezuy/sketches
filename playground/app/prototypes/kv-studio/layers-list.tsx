"use client";

import type { Composition } from "@/lib/kv/model";
import { cn } from "@/lib/utils";
import { animatable, layerKeys } from "./animate";
import { LAYER_TYPE_LABEL } from "./data";
import type { Anim } from "./types";

/** The poster's layers, front first, as in the KV Editor. A dot marks layers that move. */
export function LayersList({ comp, anim, selected, onSelect }: { comp: Composition; anim: Anim; selected: string; onSelect: (id: string) => void }) {
  const keys = layerKeys(comp);
  const moving = new Set([...anim.tracks.map((t) => t.layer), ...anim.mix.map((b) => b.layer)]);
  return (
    <nav aria-label="Layers" className="flex flex-col p-2">
      <h2 className="px-2 pt-1 pb-2 text-xs font-medium text-muted-foreground">Layers</h2>
      {[...animatable(comp)].reverse().map((l) => (
        <button
          key={l.id}
          type="button"
          aria-pressed={l.id === selected}
          onClick={() => onSelect(l.id)}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-md px-2 text-left text-sm transition-colors",
            l.id === selected ? "bg-accent text-accent-foreground" : "hover:bg-muted active:bg-muted",
          )}
        >
          <span className={cn("size-1.5 shrink-0 rounded-full", moving.has(keys.get(l.id)!) ? "bg-primary" : "bg-transparent")} />
          <span className="min-w-0 flex-1 truncate">{l.name}</span>
          <span className="text-xs text-muted-foreground">{LAYER_TYPE_LABEL[l.type] ?? l.type}</span>
        </button>
      ))}
    </nav>
  );
}
