import type { GalleryFilter, GalleryItem } from "./types";

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Every word of the query must appear in the title, description or tags. Tags are AND. */
export function filterItems(items: GalleryItem[], filter: GalleryFilter): GalleryItem[] {
  const words = normalize(filter.query).split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    if (item.hidden && !filter.showHidden) return false;
    if (!filter.tags.every((t) => item.tags.includes(t))) return false;
    const haystack = normalize([item.title, item.description, ...item.tags].join(" "));
    return words.every((w) => haystack.includes(w));
  });
}

/** Tags of the items the visitor can see, most used first. */
export function collectTags(items: GalleryItem[], showHidden: boolean): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.hidden && !showHidden) continue;
    for (const t of item.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}
