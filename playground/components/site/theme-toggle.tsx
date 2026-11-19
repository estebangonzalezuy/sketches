"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const ORDER = ["dark", "light", "system"] as const;
const LABEL = { dark: "Dark", light: "Light", system: "System" } as const;

/** Cycles dark → light → system. The icon follows the resolved theme through CSS, so nothing flashes on load. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = (ORDER as readonly string[]).includes(theme ?? "")
    ? (theme as (typeof ORDER)[number])
    : "dark";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${LABEL[current]}. Switch to ${LABEL[next]}`}
      onClick={() => setTheme(next)}
      suppressHydrationWarning
    >
      <MoonIcon className="hidden dark:block" />
      <SunIcon className="dark:hidden" />
    </Button>
  );
}
