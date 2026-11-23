import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { TOOLS } from "./data";

export function ToolList() {
  return (
    <ol className="flex flex-col">
      {TOOLS.map((t) => (
        <li key={t.slug} className="border-t border-border last:border-b">
          <Link
            href={`/prototypes/${t.slug}`}
            className="group flex min-h-11 items-baseline gap-4 py-4 transition-colors hover:bg-muted active:bg-muted sm:gap-6 sm:px-2"
          >
            <span className="w-8 shrink-0 text-xl text-muted-foreground tabular-nums">{t.n}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-3xl leading-tight font-bold sm:text-4xl">{t.title}</span>
              <span className="text-base text-muted-foreground">{t.line}</span>
            </span>
            <ArrowRightIcon aria-hidden className="size-5 shrink-0 self-center transition-transform group-hover:translate-x-1" />
          </Link>
        </li>
      ))}
    </ol>
  );
}
