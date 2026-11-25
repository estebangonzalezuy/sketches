"use client";

import { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CircleIcon, ImageUpIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  spread: number;
  /** One name per spread, cover first. */
  names: string[];
  onTurn: (dir: 1 | -1) => void;
  recording: number | null;
  onRecord: () => void;
  error: string | null;
  onUpload: (file: File) => void;
};

/** The row under the piece: previous / next, where you are, a cover upload, and Record. */
export function MagazineControls({ spread, names, onTurn, recording, onRecord, error, onUpload }: Props) {
  const busy = recording !== null;
  const file = useRef<HTMLInputElement>(null);
  return (
    <div
      data-capture-hide
      className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pr-[4.5rem] pl-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pr-4"
    >
      {error && <p className="pointer-events-auto text-sm text-destructive">{error}</p>}
      <div className="pointer-events-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Previous page" disabled={busy || spread === 0} onClick={() => onTurn(-1)}>
          <ChevronLeftIcon />
        </Button>
        <p className="w-20 truncate text-center sm:w-32 text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {names[spread]}
        </p>
        <Button variant="ghost" size="icon" aria-label="Next page" disabled={busy || spread >= names.length - 1} onClick={() => onTurn(1)}>
          <ChevronRightIcon />
        </Button>
        <input
          ref={file}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
        <Button variant="outline" size="icon" className="ml-1 sm:w-auto sm:px-2.5" disabled={busy} onClick={() => file.current?.click()} aria-label="Upload a cover image">
          <ImageUpIcon />
          <span className="hidden sm:inline">Cover</span>
        </Button>
        <Button variant={busy ? "secondary" : "outline"} size="icon" className="ml-1 sm:w-auto sm:px-2.5" onClick={onRecord} aria-label={busy ? "Cancel recording" : "Record MP4"}>
          {busy ? <XIcon /> : <CircleIcon />}
          <span className="hidden tabular-nums sm:inline">{busy ? `${Math.round((recording ?? 0) * 100)}%` : "Record"}</span>
        </Button>
      </div>
    </div>
  );
}
