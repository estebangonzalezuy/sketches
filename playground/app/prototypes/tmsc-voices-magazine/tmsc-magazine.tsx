"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ControlsLayout, useControls } from "@/components/controls";
import { Spinner } from "@/components/ui/spinner";
import { controls, pageSetup, recordFormat } from "./controls";
import { PAGE_PX, PAGE_PX_SMALL, RECORD_FORMATS, SLUG } from "./data";
import { Driver } from "./driver";
import { MagazineControls } from "./magazine-controls";
import { MagazineScene } from "./magazine-scene";
import { bakePages } from "./page-bake";
import { downloadBlob, recordMp4 } from "./recorder";
import { useReducedMotion } from "./use-reduced-motion";

export function TmscMagazine() {
  const driverRef = useRef(new Driver());
  const [pages, setPages] = useState<Map<string, HTMLCanvasElement> | null>(null);
  const [spread, setSpread] = useState(0);
  const c = useControls(SLUG, controls);
  const setupKey = JSON.stringify(pageSetup(c.values));
  const format = recordFormat(c.values);
  const [recording, setRecording] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancel = useRef({ cancel: false });
  const reduced = useReducedMotion();

  const setup = useMemo(() => JSON.parse(setupKey) as ReturnType<typeof pageSetup>, [setupKey]);

  // re-bake whenever the picked images change; the old pages stay up until the new ones are ready
  useEffect(() => {
    let alive = true;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    bakePages(small ? PAGE_PX_SMALL : PAGE_PX, setup)
      .then((p) => alive && setPages(p))
      .catch(() => alive && setError("The pages didn't load. Reload to try again."));
    return () => {
      alive = false;
    };
  }, [setup]);

  useEffect(() => {
    const d = driverRef.current;
    d.controller.reduced = reduced;
    d.onFrame = () => setSpread((s) => (s === d.controller.turned ? s : d.controller.turned));
  }, [reduced]);

  const turn = useCallback((dir: 1 | -1) => driverRef.current.controller.turn(dir), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = driverRef.current;
      if (d.recording || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest?.("input, textarea, select, [contenteditable]"))
        return;
      if (e.key === "ArrowRight") d.controller.turn(1);
      else if (e.key === "ArrowLeft") d.controller.turn(-1);
      else if (e.key === "Home") d.controller.goTo(0);
      else if (e.key === "End") d.controller.goTo(Infinity);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const record = useCallback(async () => {
    if (recording !== null) {
      cancel.current.cancel = true;
      return;
    }
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
  }, [format, recording]);

  return (
    <ControlsLayout controls={c}>
      <main className="relative flex h-[calc(100dvh-3rem-env(safe-area-inset-top))] min-h-80 w-full flex-col">
        {pages ? (
          <MagazineScene pages={pages} driverRef={driverRef} />
        ) : (
          !error && (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <Spinner />
            </div>
          )
        )}
        <MagazineControls
          spread={spread}
          onTurn={turn}
          recording={recording}
          onRecord={record}
          error={error}
        />
      </main>
    </ControlsLayout>
  );
}
