"use client";

import { useRef, useState } from "react";
import { DownloadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportMP4 } from "./export-mp4";
import type { Settings } from "./types";

/** Renders whole loops offline and downloads the MP4. Tap again to cancel. */
export function ExportButton({ settings, text }: { settings: Settings; text: string }) {
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
          const blob = await exportMP4(settings, text, setProgress, signal.current);
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${text.trim().toLowerCase().replace(/\s+/g, "-") || "kinetic-pin"}.mp4`;
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
