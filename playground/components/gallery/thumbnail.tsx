/* eslint-disable @next/next/no-img-element -- static files; next/image would add a gated optimizer round-trip */
import type { GalleryItem } from "./types";

/**
 * Static screenshot, never a live iframe. Both themes are in the DOM and CSS picks one
 * (`dark:` variant on the class next-themes sets before paint), so nothing flashes.
 */
export function Thumbnail({ item, priority }: { item: GalleryItem; priority?: boolean }) {
  const frame =
    "aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-muted transition-[border-color] group-hover:border-foreground/30 group-active:border-foreground/30";
  if (!item.thumbnail) {
    return (
      <div className={`${frame} flex items-center justify-center text-xs text-muted-foreground`}>
        No preview yet
      </div>
    );
  }
  const loading = priority ? "eager" : "lazy";
  return (
    <div className={frame}>
      <img
        src={item.thumbnail.light}
        alt=""
        loading={loading}
        decoding="async"
        width={640}
        height={400}
        className="size-full object-cover dark:hidden"
      />
      <img
        src={item.thumbnail.dark}
        alt=""
        loading={loading}
        decoding="async"
        width={640}
        height={400}
        className="hidden size-full object-cover dark:block"
      />
    </div>
  );
}
