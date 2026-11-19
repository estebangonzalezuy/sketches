import { Gallery } from "@/components/gallery/gallery";
import { listPrototypes } from "@/lib/prototypes";

export default function Home() {
  const prototypes = listPrototypes().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
    updatedAt: p.updatedAt,
    hidden: p.hidden,
    public: p.public,
    thumbnail: p.thumbnail,
  }));
  return <Gallery prototypes={prototypes} />;
}
