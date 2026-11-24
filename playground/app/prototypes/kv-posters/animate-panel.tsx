"use client";

import { useRef, useState } from "react";
import { DownloadIcon, PauseIcon, PlayIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { CurveEditor } from "@/lib/studio/ui/curve-editor";
import type { Ease } from "@/lib/studio/model/types";

export function AnimatePanel({ t, duration, fps, playing, toggle, scrub, onExport, ease, setEase }: {
  t: number;
  duration: number;
  fps: number;
  playing: boolean;
  toggle: () => void;
  scrub: (v: number) => void;
  onExport: (onProgress: (v: number) => void, signal: { cancel: boolean }) => Promise<void>;
  ease: Ease;
  setEase: (e: Ease) => void;
}) {
  const [job, setJob] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const signal = useRef({ cancel: false });
  const start = async () => {
    signal.current = { cancel: false };
    setError(null);
    setJob(0);
    try {
      await onExport(setJob, signal.current);
    } catch (e) {
      if ((e as Error).message !== "Cancelled") setError((e as Error).message);
    } finally {
      setJob(null);
    }
  };
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <Slider aria-label="Time" min={0} max={duration} step={1 / fps} value={[t]} onValueChange={([v]) => scrub(v)} />
        <span className="w-20 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
          {t.toFixed(1)} / {duration.toFixed(1)}s
        </span>
      </div>
      {job !== null ? (
        <div className="flex items-center gap-3">
          <Progress value={job * 100} className="flex-1" />
          <Button variant="ghost" size="icon" aria-label="Cancel export" onClick={() => (signal.current.cancel = true)}>
            <XIcon />
          </Button>
        </div>
      ) : (
        <Button onClick={start} className="h-11 justify-self-start px-4">
          <DownloadIcon />
          Export MP4
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <section className="grid gap-2 rounded-md border border-border p-3">
        <h2 className="text-sm font-medium">Easing</h2>
        <CurveEditor value={ease} mixed={false} onChange={(e) => setEase(e)} />
      </section>
    </div>
  );
}
