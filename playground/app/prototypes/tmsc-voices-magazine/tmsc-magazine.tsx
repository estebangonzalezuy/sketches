"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ControlsLayout, useControls } from "@/components/controls";
import { Spinner } from "@/components/ui/spinner";
import { controls, pageSetup, recordFormat, stageSetup } from "./controls";
import { saveUploadedCover, useUploadedCover } from "./cover-upload";
import { PAGE_PX, PAGE_PX_SMALL, RECORD_FORMATS, SLUG } from "./data";
import { Driver } from "./driver";
import { buildBook, type Book } from "./faces";
import { MagazineControls } from "./magazine-controls";
import { MagazineScene } from "./magazine-scene";
import { bakePages } from "./page-bake";
import { downloadBlob, recordMp4 } from "./recorder";
import { useReducedMotion } from "./use-reduced-motion";

export function TmscMagazine() {
  const driverRef = useRef(new Driver());
  const [baked, setBaked] = useState<{ book: Book; pages: Map<string, HTMLCanvasElement> } | null>(null);
  const [spread, setSpread] = useState(0);
  const c = useControls(SLUG, controls);
  const setupKey = JSON.stringify(pageSetup(c.values));
  const stageKey = JSON.stringify(stageSetup(c.values));
  const format = recordFormat(c.values);
  const [recording, setRecording] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancel = useRef({ cancel: false });
  const reduced = useReducedMotion();
  const uploaded = useUploadedCover();

  const setup = useMemo(() => JSON.parse(setupKey) as ReturnType<typeof pageSetup>, [setupKey]);
  const stage = useMemo(() => JSON.parse(stageKey) as ReturnType<typeof stageSetup>, [stageKey]);

  // re-bake whenever the setup changes; the old pages stay up until the new ones are ready.
  // Toggling the Q&A pages changes the sheet count, so the controller starts again at the cover.
  useEffect(() => {
    let alive = true;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    const book = buildBook(setup.editorial.on);
    bakePages(small ? PAGE_PX_SMALL : PAGE_PX, book, setup, uploaded)
      .then((pages) => {
        if (!alive) return;
        driverRef.current.useBook(book);
        setBaked({ book, pages });
      })
      .catch(() => alive && setError("The pages didn't load. Reload to try again."));
    return () => {
      alive = false;
    };
  }, [setup, uploaded]);

  useEffect(() => {
    const d = driverRef.current;
    d.controller.reduced = reduced;
    d.onFrame = () => setSpread((s) => (s === d.controller.turned ? s : d.controller.turned));
  }, [reduced]);

  const { set } = c;
  const style = c.values.coverStyle;
  const upload = useCallback(
    async (file: File) => {
      setError(null);
      try {
        await saveUploadedCover(file);
        set("coverImage", "Uploaded");
        if (style === "Type") set("coverStyle", "Full image");
        driverRef.current.controller.goTo(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "That image didn't load.");
      }
    },
    [set, style],
  );

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
      {/* fills the viewport under the bar (and all of it when the bar is hidden, as in thumbnails) */}
      <main className="relative flex min-h-[max(20rem,calc(100dvh-3rem-1px-env(safe-area-inset-top)))] w-full flex-1 flex-col">
        {baked ? (
          <div className="absolute inset-0">
            <MagazineScene book={baked.book} pages={baked.pages} stage={stage} driverRef={driverRef} />
          </div>
        ) : (
          !error && (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <Spinner />
            </div>
          )
        )}
        <MagazineControls
          spread={spread}
          names={baked?.book.spreadNames ?? ["Cover"]}
          onTurn={turn}
          recording={recording}
          onRecord={record}
          error={error}
          onUpload={upload}
        />
      </main>
    </ControlsLayout>
  );
}
