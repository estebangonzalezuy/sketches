import { cn } from "cn";

/** The master value, shown at the head of every chain so it reads as the one source. */
export function TChip({ t, className }: { t: number; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-md bg-primary px-1.5 py-0.5 font-mono text-xs text-primary-foreground tabular-nums",
        className,
      )}
    >
      {t.toFixed(2)}
    </span>
  );
}
