"use client";

import { useRef, useState } from "react";
import { DownloadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportMP4 } from "../export-mp4";
import { useStudio } from "./context";

/** Renders every frame offline and downloads an MP4. Tap again to cancel. */
export function ExportButton() {
  const { project } = useStudio();
  const [progress, setProgress] = useState<number | null>(null);
  const signal = useRef({ cancel: false });
  if (progress !== null)
    return (
      <Button variant="outline" aria-label="Cancel export" className="tabular-nums" onClick={() => (signal.current.cancel = true)}>
        <XIcon />
        {Math.round(progress * 100)}%
      </Button>
    );
  return (
    <Button
      aria-label="Export MP4"
      onClick={async () => {
        signal.current = { cancel: false };
        setProgress(0);
        try {
          const blob = await exportMP4(project, setProgress, signal.current);
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${project.name || "studio"}.mp4`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
        } catch (e) {
          if (!signal.current.cancel) toast.error(e instanceof Error ? e.message : "Export failed");
        } finally {
          setProgress(null);
        }
      }}
    >
      <DownloadIcon />
      MP4
    </Button>
  );
}
