"use client";

import { useRef } from "react";
import { ChartNoAxesGanttIcon, ChevronLeftIcon, ChevronRightIcon, CircleIcon, ImageUpIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Props = {
  spread: number;
  /** One name per spread, cover first. */
  names: string[];
  onTurn: (dir: 1 | -1) => void;
  recording: number | null;
  onRecord: () => void;
  error: string | null;
  onUpload: (what: "cover" | "texture", file: File) => void;
  timelineOpen: boolean;
  onTimeline: () => void;
  /** The timeline panel, shown above the row when open. */
  children?: React.ReactNode;
};

/** The row under the piece: previous / next, where you are, uploads, the timeline, Record. */
export function MagazineControls({ spread, names, onTurn, recording, onRecord, error, onUpload, timelineOpen, onTimeline, children }: Props) {
  const busy = recording !== null;
  const file = useRef<HTMLInputElement>(null);
  const target = useRef<"cover" | "texture">("cover");
  const pick = (what: "cover" | "texture") => {
    target.current = what;
    file.current?.click();
  };
  return (
    <div
      data-capture-hide
      className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pr-[4.5rem] pl-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pr-4"
    >
      {children}
      {error && <p className="pointer-events-auto text-sm text-destructive">{error}</p>}
      {/* its own backdrop: the table color is picked freely, so the row can't rely on the page theme */}
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-background/85 p-1 backdrop-blur">
        <Button variant="ghost" size="icon" aria-label="Previous page" disabled={busy || spread === 0} onClick={() => onTurn(-1)}>
          <ChevronLeftIcon />
        </Button>
        <p className="hidden w-32 truncate text-center text-sm tabular-nums text-muted-foreground sm:block" aria-live="polite">
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
            if (f) onUpload(target.current, f);
            e.target.value = "";
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* explicit 44px: an asChild trigger replaces data-slot, so the global touch rule misses it */}
            <Button variant="outline" size="icon" className="ml-1 size-11 sm:size-auto sm:h-8 sm:w-auto sm:px-2.5" disabled={busy} aria-label="Upload an image">
              <ImageUpIcon />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top">
            <DropdownMenuItem onSelect={() => pick("cover")}>Cover image…</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => pick("texture")}>Paper texture…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant={timelineOpen ? "secondary" : "outline"} size="icon" className="sm:w-auto sm:px-2.5" disabled={busy} onClick={onTimeline} aria-label="Timeline" aria-pressed={timelineOpen}>
          <ChartNoAxesGanttIcon />
          <span className="hidden sm:inline">Timeline</span>
        </Button>
        <Button variant={busy ? "secondary" : "outline"} size="icon" className="sm:w-auto sm:px-2.5" onClick={onRecord} aria-label={busy ? "Cancel recording" : "Record MP4"}>
          {busy ? <XIcon /> : <CircleIcon />}
          <span className="hidden tabular-nums sm:inline">{busy ? `${Math.round((recording ?? 0) * 100)}%` : "Record"}</span>
        </Button>
      </div>
    </div>
  );
}
