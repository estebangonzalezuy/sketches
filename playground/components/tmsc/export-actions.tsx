"use client";

import { useState, useSyncExternalStore } from "react";
import { CircleIcon, ImageDownIcon, SquareIcon, VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadBlob, renderPNG } from "@/lib/tmsc/download";
import { ensureFont } from "@/lib/tmsc/fonts";
import { renderVideo, videoLabel, type DrawAt } from "@/lib/tmsc/video";
import { liveLabel } from "./use-live-recording";

type Size = { w: number; h: number };
const noop = () => () => {};

/** Export PNG at the current format. */
export function PngButton({ size, name, draw }: { size: Size; name: string; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }) {
  const run = async () => {
    try {
      await ensureFont();
      const blob = await renderPNG(size.w, size.h, (ctx) => draw(ctx, size.w, size.h));
      downloadBlob(blob, `${name}-${size.w}x${size.h}.png`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <Button variant="outline" onClick={run} className="justify-start">
      <ImageDownIcon />
      Export PNG
      <span className="ml-auto font-mono text-xs text-muted-foreground">{size.w}×{size.h}</span>
    </Button>
  );
}

/** Start/stop a live take (interactive tools). */
export function LiveRecordButton({ recording, onToggle }: { recording: boolean; onToggle: () => void }) {
  const label = useSyncExternalStore(noop, liveLabel, () => "MP4" as const);
  return (
    <Button variant={recording ? "destructive" : "outline"} onClick={onToggle} className="justify-start" aria-pressed={recording}>
      {recording ? <SquareIcon /> : <CircleIcon />}
      {recording ? "Stop recording" : `Record ${label}`}
      {label === "WebM" && !recording && <span className="ml-auto text-xs text-muted-foreground">MP4 not supported here</span>}
    </Button>
  );
}

/** Frame-exact render of a timed scene (pure function of t). */
export function RenderVideoButton({ size, name, duration, drawAt }: { size: Size; name: string; duration: number; drawAt: DrawAt }) {
  const [progress, setProgress] = useState<number | null>(null);
  const label = useSyncExternalStore(noop, videoLabel, () => "MP4" as const);
  const run = async () => {
    if (progress !== null) return;
    setProgress(0);
    try {
      await ensureFont();
      const { blob, ext } = await renderVideo({ width: size.w, height: size.h, duration, draw: drawAt, onProgress: setProgress });
      downloadBlob(blob, `${name}-${size.w}x${size.h}.${ext}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setProgress(null);
    }
  };
  return (
    <Button variant="outline" onClick={run} disabled={progress !== null} className="justify-start">
      <VideoIcon />
      {progress === null ? `Record ${label}` : `Rendering ${Math.round(progress * 100)}%`}
      <span className="ml-auto font-mono text-xs text-muted-foreground">{duration}s</span>
    </Button>
  );
}

/** Stack of panel actions. */
export function Actions({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-2">{children}</div>;
}
