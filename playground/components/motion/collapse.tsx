"use client";

import { cn } from "@/lib/utils";

/**
 * Animates height open and closed with the grid-rows trick (no measuring, no JS).
 * Rows animate in on mount via @starting-style, so a freshly added row grows instead of
 * popping in. To remove a row smoothly: set `open={false}`, then drop it in `onClosed`.
 *
 *   {rows.map((r) => (
 *     <Collapse key={r.id} open={!r.removing} onClosed={() => drop(r.id)}>…</Collapse>
 *   ))}
 */
export function Collapse({
  open = true,
  onClosed,
  className,
  children,
}: {
  open?: boolean;
  onClosed?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-open={open}
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && !open) onClosed?.();
      }}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out-smooth",
        "grid-rows-[1fr] opacity-100 starting:grid-rows-[0fr] starting:opacity-0",
        "data-[open=false]:grid-rows-[0fr] data-[open=false]:opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
