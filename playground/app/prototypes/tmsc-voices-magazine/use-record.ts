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
      const blob = await recordMp4(driverRef.current, format, setRecording, cancel.current);
      const { w, h } = RECORD_FORMATS[format];
      downloadBlob(blob, `tmsc-voices-${w}x${h}.mp4`);
    } catch (e) {
      if (!cancel.current.cancel) setError(e instanceof Error ? e.message : "Recording failed.");
    } finally {
      setRecording(null);
    }
  }, [driverRef, format, recording, live, setError]);
  return { recording, record };
}
