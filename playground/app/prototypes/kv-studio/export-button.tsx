"use client";

import { useRef, useState } from "react";
import { DownloadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Composition } from "@/lib/kv/model";
import { exportMP4 } from "./export-mp4";
import type { Anim } from "./types";

/** Renders every frame offline and downloads an MP4. Shows progress; tap again to cancel. */
export function ExportButton({ comp, anim, duration, fps }: { comp: Composition; anim: Anim; duration: number; fps: number }) {
  const [progress, setProgress] = useState<number | null>(null);
  const signal = useRef({ cancel: false });

  const start = async () => {
    signal.current = { cancel: false };
    setProgress(0);
    try {
      const blob = await exportMP4(comp, anim, duration, fps, setProgress, signal.current);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${comp.name.replace(/[^\w,.\- ]+/g, "").trim() || "poster"}.mp4`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    } catch (e) {
      if (!signal.current.cancel) toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setProgress(null);
    }
  };

  if (progress !== null)
    return (
      <Button variant="outline" aria-label="Cancel export" onClick={() => (signal.current.cancel = true)} className="tabular-nums">
        <XIcon />
        {Math.round(progress * 100)}%
      </Button>
    );
  return (
    <Button variant="outline" aria-label="Export MP4" onClick={start} className="sm:w-auto">
      <DownloadIcon />
      MP4
    </Button>
  );
}
