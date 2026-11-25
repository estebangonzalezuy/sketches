"use client";

import { ChevronLeftIcon, ChevronRightIcon, CircleIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHEET_COUNT, SPREAD_NAMES } from "./data";

type Props = {
  spread: number;
  onTurn: (dir: 1 | -1) => void;
  recording: number | null;
  onRecord: () => void;
  error: string | null;
};

/** The row under the piece: previous / next, where you are, and Record. The format is in the panel. */
export function MagazineControls({ spread, onTurn, recording, onRecord, error }: Props) {
  const busy = recording !== null;
  return (
    <div
      data-capture-hide
      className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {error && <p className="pointer-events-auto text-sm text-destructive">{error}</p>}
      <div className="pointer-events-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Previous page" disabled={busy || spread === 0} onClick={() => onTurn(-1)}>
          <ChevronLeftIcon />
        </Button>
        <p className="w-24 truncate text-center sm:w-32 text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {SPREAD_NAMES[spread]}
        </p>
        <Button variant="ghost" size="icon" aria-label="Next page" disabled={busy || spread === SHEET_COUNT} onClick={() => onTurn(1)}>
          <ChevronRightIcon />
        </Button>
        <Button variant={busy ? "secondary" : "outline"} size="icon" className="ml-1 sm:w-auto sm:px-2.5" onClick={onRecord} aria-label={busy ? "Cancel recording" : "Record MP4"}>
          {busy ? <XIcon /> : <CircleIcon />}
          <span className="hidden tabular-nums sm:inline">{busy ? `${Math.round((recording ?? 0) * 100)}%` : "Record"}</span>
        </Button>
      </div>
    </div>
  );
}
