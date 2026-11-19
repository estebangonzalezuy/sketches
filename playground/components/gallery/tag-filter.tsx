"use client";

import { cn } from "@/lib/utils";

/** Plain, single-color tag chips. Selected chips invert. */
export function TagFilter({
  tags,
  selected,
  onToggle,
}: {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <div className="-mx-1 flex flex-wrap gap-1" role="group" aria-label="Filter by tag">
      {tags.map((t) => {
        const on = selected.includes(t);
        return (
          <button
            key={t}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(t)}
            className="group flex min-h-11 items-center px-1 sm:min-h-0"
          >
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs transition-colors",
                on
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground group-hover:text-foreground group-active:text-foreground",
              )}
            >
              {t}
            </span>
          </button>
        );
      })}
    </div>
  );
}
