"use client";

import { useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PlusIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addFeature, DEFAULT_MAGAZINE, moveFeature, removeFeature, updateFeature, type Magazine } from "./feature";
import type { FeatureData } from "./feature-data";
import { FeatureCard } from "./feature-card";
import { usePostList } from "./post-client";

type Props = {
  magazine: Magazine;
  onChange: (m: Magazine) => void;
  /** Resolved data per feature id (null while its post loads). */
  data: Record<string, FeatureData | null>;
  onClose: () => void;
};

/**
 * The magazine's features, in order. Each is one Substack post (intro spread + article
 * spread). Add, remove, drag to reorder, open one to choose its post, quote, images, colors.
 */
export function FeaturesPanel({ magazine, onChange, data, onClose }: Props) {
  const list = usePostList();
  const posts = list.status === "ready" ? list.posts : [];
  const [open, setOpen] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const ids = magazine.features.map((f) => f.id);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onChange(moveFeature(magazine, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };
  const add = () => {
    // the newest post not in the magazine yet
    const used = new Set(magazine.features.map((f) => f.slug));
    const next = posts.find((p) => !used.has(p.slug) && !p.paid) ?? posts[0];
    if (!next) return;
    const m = addFeature(magazine, next.slug);
    onChange(m);
    setOpen(m.features[m.features.length - 1].id);
  };

  return (
    <aside
      aria-label="Features"
      data-capture-hide
      className="fixed inset-x-0 bottom-0 z-40 flex max-h-[60dvh] flex-col rounded-t-xl border-t border-border bg-background lg:top-[calc(3rem+1px+env(safe-area-inset-top))] lg:right-auto lg:max-h-none lg:w-80 lg:rounded-none lg:border-t-0 lg:border-r"
    >
      <div className="flex items-center gap-1 border-b border-border px-3 py-1">
        <h2 className="flex-1 text-sm font-medium">
          Features <span className="text-muted-foreground tabular-nums">{magazine.features.length}</span>
        </h2>
        <Button variant="ghost" size="icon" onClick={() => onChange(DEFAULT_MAGAZINE)} aria-label="Back to the four latest interviews">
          <RotateCcwIcon />
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close features">
          <XIcon />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {list.status === "error" && <p className="mb-2 text-sm text-destructive">Couldn&apos;t load the posts: {list.error}</p>}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-2">
              {magazine.features.map((f, i) => (
                <FeatureCard
                  key={f.id}
                  feature={f}
                  index={i}
                  count={magazine.features.length}
                  data={data[f.id] ?? null}
                  posts={posts}
                  open={open === f.id}
                  onToggle={() => setOpen(open === f.id ? null : f.id)}
                  onChange={(patch) => onChange(updateFeature(magazine, f.id, patch))}
                  onMove={(to) => onChange(moveFeature(magazine, i, to))}
                  onRemove={() => onChange(removeFeature(magazine, f.id))}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
        <Button variant="outline" className="mt-3 w-full" onClick={add} disabled={list.status !== "ready"}>
          <PlusIcon />
          Add feature
        </Button>
      </div>
    </aside>
  );
}
