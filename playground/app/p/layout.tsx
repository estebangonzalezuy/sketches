import { PrototypeBar } from "@/components/site/prototype-bar";
import { listPrototypes } from "@/lib/prototypes";

export default function PublicLayout({ children }: LayoutProps<"/p">) {
  const titles = Object.fromEntries(
    listPrototypes()
      .filter((p) => p.public)
      .map((p) => [p.slug, p.title]),
  );
  return (
    <>
      <PrototypeBar titles={titles} backHref={null} />
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
