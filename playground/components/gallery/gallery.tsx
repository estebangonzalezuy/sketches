"use client";

import { useMemo, useState } from "react";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { collectTags, filterItems } from "./filter";
import { GalleryToolbar } from "./gallery-toolbar";
import { PrototypeCard } from "./prototype-card";
import type { GalleryItem } from "./types";

export function Gallery({ prototypes }: { prototypes: GalleryItem[] }) {
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);

  const visible = useMemo(
    () => filterItems(prototypes, { query, tags, showHidden }),
    [prototypes, query, tags, showHidden],
  );
  const allTags = useMemo(() => collectTags(prototypes, showHidden), [prototypes, showHidden]);
  const hiddenCount = prototypes.filter((p) => p.hidden).length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-medium">Playground</h1>
        <ThemeToggle />
      </header>

      <GalleryToolbar
        query={query}
        onQuery={setQuery}
        tags={allTags}
        selected={tags}
        onToggleTag={(t) =>
          setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))
        }
        hiddenCount={hiddenCount}
        showHidden={showHidden}
        onShowHidden={setShowHidden}
      />

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {prototypes.length === 0 ? "No prototypes yet." : "Nothing matches."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <li key={p.slug}>
              <PrototypeCard item={p} priority={i < 3} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
