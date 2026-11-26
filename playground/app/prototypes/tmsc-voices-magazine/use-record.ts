"use client";

import { useCallback, useRef, useState } from "react";
import { RECORD_FORMATS } from "./data";
import type { DriverRef } from "./driver";
import { downloadBlob, recordMp4 } from "./recorder";
import type { RecordFormat } from "./types";

/** Record button state: progress (null when idle), start / cancel, download on success. */
export function useRecord(driverRef: DriverRef, format: RecordFormat, live: () => void, setError: (e: string | null) => void) {
  const [recording, setRecording] = useState<number | null>(null);
  const cancel = useRef({ cancel: false });
  const record = useCallback(async () => {
    if (recording !== null) {
      cancel.current.cancel = true;
      return;
    }
    live();
    cancel.current = { cancel: false };
    setError(null);
    setRecording(0);
    try {
      const { blob, w, h, reduced } = await recordMp4(driverRef.current, format, setRecording, cancel.current);
      downloadBlob(blob, `tmsc-voices-${w}x${h}.mp4`);
      if (reduced) {
        const full = RECORD_FORMATS[format];
        setError(`This browser can't encode ${full.w}×${full.h}, so the video was saved at ${w}×${h}.`);
      }
    } catch (e) {
      if (!cancel.current.cancel) setError(e instanceof Error ? e.message : "Recording failed.");
    } finally {
      setRecording(null);
    }
  }, [driverRef, format, recording, live, setError]);
  return { recording, record };
}
