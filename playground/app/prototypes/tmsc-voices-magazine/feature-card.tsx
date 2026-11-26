"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, GripVerticalIcon, Trash2Icon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Feature } from "./feature";
import type { FeatureData } from "./feature-data";
import { FeatureFields } from "./feature-fields";
import { postEntry } from "./post-client";
import type { PostSummary } from "./substack-parse";

type Props = {
  feature: Feature;
  index: number;
  count: number;
  data: FeatureData | null;
  posts: PostSummary[];
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Feature>) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
};

/** One feature in the list: drag by the grip (or use the arrows), open to edit it. */
export function FeatureCard({ feature, index, count, data, posts, open, onToggle, onChange, onMove, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: feature.id });
  const entry = postEntry(feature.slug);
  const thumb = data?.image?.url ? `${data.image.url}&w=120` : null;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-lg border border-border bg-card p-2", isDragging && "relative z-10 shadow-lg")}
    >
      <div className="flex items-center gap-1">
        <button ref={setActivatorNodeRef} {...attributes} {...listeners} className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground" aria-label={`Drag to reorder feature ${index + 1}`}>
          <GripVerticalIcon className="size-4" />
        </button>
        <button type="button" onClick={onToggle} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={open}>
          <span className="size-9 shrink-0 overflow-hidden rounded bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- same-origin proxy thumbnail */}
            {thumb && <img src={thumb} alt="" className="size-full object-cover" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{data?.guest ?? (entry.status === "error" ? "Couldn't load" : "Loading…")}</span>
            <span className="block truncate text-xs text-muted-foreground">{data?.title ?? feature.slug}</span>
          </span>
          {entry.status === "loading" ? <Spinner /> : <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />}
        </button>
      </div>
      {open && (
        <div className="px-1 pb-1">
          {entry.status === "ready" && data ? (
            <FeatureFields feature={feature} data={data} post={entry.post} posts={posts} onChange={onChange} />
          ) : entry.status === "error" ? (
            <p className="py-2 text-sm text-destructive">{entry.error}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-1">
            <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Move up">
              <ArrowUpIcon />
            </Button>
            <Button variant="ghost" size="icon" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Move down">
              <ArrowDownIcon />
            </Button>
            <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={onRemove}>
              <Trash2Icon />
              Remove
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
