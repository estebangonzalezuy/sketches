import { PrototypeBar } from "@/components/site/prototype-bar";
import { listPrototypes } from "@/lib/prototypes";

export default function PrototypesLayout({ children }: LayoutProps<"/prototypes">) {
  const titles = Object.fromEntries(listPrototypes().map((p) => [p.slug, p.title]));
  return (
    <>
      <PrototypeBar titles={titles} backHref="/" />
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
