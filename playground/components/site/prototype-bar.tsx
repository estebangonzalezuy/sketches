"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

/**
 * Slim bar above every prototype. `backHref` is null on public pages, which must not
 * link to the private gallery.
 */
export function PrototypeBar({
  titles,
  backHref,
}: {
  titles: Record<string, string>;
  backHref: string | null;
}) {
  const slug = usePathname().split("/")[2] ?? "";
  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-1 border-b border-border bg-background/80 px-2 backdrop-blur pt-[env(safe-area-inset-top)] box-content">
      {backHref && (
        <Button asChild variant="ghost" size="icon" className="sm:w-auto sm:px-2.5">
          <Link href={backHref} aria-label="All prototypes">
            <ArrowLeftIcon />
            <span className="hidden sm:inline">Playground</span>
          </Link>
        </Button>
      )}
      <h1 className="min-w-0 flex-1 truncate px-2 text-sm font-medium">{titles[slug] ?? ""}</h1>
      <ThemeToggle />
    </header>
  );
}
