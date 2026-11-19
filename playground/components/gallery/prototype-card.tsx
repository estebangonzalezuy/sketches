import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Thumbnail } from "./thumbnail";
import type { GalleryItem } from "./types";

export function PrototypeCard({ item, priority }: { item: GalleryItem; priority?: boolean }) {
  return (
    <Link
      href={`/prototypes/${item.slug}`}
      className="group flex flex-col gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Thumbnail item={item} priority={priority} />
      <div className="flex flex-col gap-1 px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-sm font-medium">{item.title}</h2>
          {item.public && <Badge variant="outline">Public</Badge>}
          {item.hidden && <Badge variant="outline">Hidden</Badge>}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
      </div>
    </Link>
  );
}
