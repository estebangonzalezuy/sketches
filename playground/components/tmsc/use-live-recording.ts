"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/tmsc/download";
import { LiveRecorder, recorderType } from "@/lib/tmsc/video";

/** Start/stop a recording of what the stage draws, at export size. Downloads on stop. */
export function useLiveRecording(size: { w: number; h: number }, name: string) {
  const [recorder, setRecorder] = useState<LiveRecorder | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const ref = useRef<LiveRecorder | null>(null);

  const stop = useCallback(async () => {
    const rec = ref.current;
    if (!rec) return;
    ref.current = null;
    setRecorder(null);
    const { blob, ext } = await rec.stop();
    downloadBlob(blob, `${name}-${size.w}x${size.h}.${ext}`);
  }, [name, size.w, size.h]);

  const toggle = useCallback(() => {
    if (ref.current) return void stop();
    try {
      const rec = new LiveRecorder(size.w, size.h);
      ref.current = rec;
      setRecorder(rec);
      setStartedAt(performance.now());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [size.w, size.h, stop]);

  // a format change mid-take would mismatch the canvas: finish the take first
  useEffect(() => {
    if (ref.current && (ref.current.canvas.width !== size.w || ref.current.canvas.height !== size.h)) void stop();
  }, [size.w, size.h, stop]);

  return { recorder, recording: recorder !== null, startedAt, toggle };
}

/** "MP4" or "WebM", for honest button labels. Client-only. */
export function liveLabel(): "MP4" | "WebM" {
  if (typeof window === "undefined") return "MP4";
  return recorderType()?.ext === "webm" ? "WebM" : "MP4";
}
