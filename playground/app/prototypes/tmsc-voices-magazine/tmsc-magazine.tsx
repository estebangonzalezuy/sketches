"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ControlsLayout, useControls } from "@/components/controls";
import { Spinner } from "@/components/ui/spinner";
import { controls } from "./controls";
import { PAGE_PX, PAGE_PX_SMALL, SLUG } from "./data";
import { Driver } from "./driver";
import { buildBook, type Book } from "./faces";
import { MagazineControls } from "./magazine-controls";
import { MagazineScene } from "./magazine-scene";
import { bakePages } from "./page-bake";
import { pageSetup, recordFormat, stageSetup } from "./setup";
import { recordPlan, spreadAt } from "./timeline";
import { TimelinePanel } from "./timeline-panel";
import { timingFrom } from "./timing";
import { setOverrides, useOverrides } from "./timing-store";
import { coverUpload, loadDataImage, textureUpload } from "./uploads";
import { useMagazineKeys } from "./use-magazine-keys";
import { useRecord } from "./use-record";
import { useReducedMotion } from "./use-reduced-motion";

export function TmscMagazine() {
  const driverRef = useRef(new Driver());
  const [baked, setBaked] = useState<{ book: Book; pages: Map<string, HTMLCanvasElement> } | null>(null);
  const [spread, setSpread] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [textureImage, setTextureImage] = useState<HTMLImageElement | null>(null);
  const reduced = useReducedMotion();
  const c = useControls(SLUG, controls);
  const uploadedCover = coverUpload.use();
  const uploadedTexture = textureUpload.use();
  const overrides = useOverrides();

  // JSON keys keep these stable while unrelated controls move
  const setupKey = JSON.stringify(pageSetup(c.values));
  const stageKey = JSON.stringify(stageSetup(c.values));
  const timingKey = JSON.stringify(timingFrom(c.values, overrides));
  const setup = useMemo(() => JSON.parse(setupKey) as ReturnType<typeof pageSetup>, [setupKey]);
  const stage = useMemo(() => JSON.parse(stageKey) as ReturnType<typeof stageSetup>, [stageKey]);
  const timing = useMemo(() => JSON.parse(timingKey) as ReturnType<typeof timingFrom>, [timingKey]);
  const plan = useMemo(() => (baked ? recordPlan(baked.book, timing) : null), [baked, timing]);
  const format = recordFormat(c.values);

  useEffect(() => {
    let alive = true;
    loadDataImage(uploadedTexture).then((img) => alive && setTextureImage(img));
    return () => {
      alive = false;
    };
  }, [uploadedTexture]);

  // re-bake whenever the setup changes; the old pages stay up until the new ones are ready.
  // Toggling the Q&A pages changes the sheet count, so the controller starts again at the cover.
  useEffect(() => {
    let alive = true;
    const small = Math.min(window.innerWidth, window.innerHeight) < 600;
    const book = buildBook(setup.editorial.on);
    bakePages(small ? PAGE_PX_SMALL : PAGE_PX, book, setup, uploadedCover, textureImage)
      .then((pages) => {
        if (!alive) return;
        driverRef.current.useBook(book);
        setBaked({ book, pages });
      })
      .catch(() => alive && setError("The pages didn't load. Reload to try again."));
    return () => {
      alive = false;
    };
  }, [setup, uploadedCover, textureImage]);

  useEffect(() => driverRef.current.setTiming(timing), [timing]);

  useEffect(() => {
    const d = driverRef.current;
    d.controller.reduced = reduced;
    d.onFrame = () => setSpread((s) => (s === d.controller.turned ? s : d.controller.turned));
  }, [reduced]);

  /** Leaves the timeline preview, staying on the spread it showed. */
  const live = useCallback(() => {
    const d = driverRef.current;
    if (d.preview && d.plan) d.endPreview(spreadAt(d.plan, d.preview.t));
  }, []);
  useMagazineKeys(driverRef, live);

  const { set } = c;
  const coverStyle = c.values.coverStyle;
  const upload = useCallback(
    async (what: "cover" | "texture", file: File) => {
      setError(null);
      try {
        if (what === "cover") {
          await coverUpload.save(file);
          set("coverImage", "Uploaded");
          if (coverStyle === "Type") set("coverStyle", "Full image");
          live();
          driverRef.current.controller.goTo(0);
        } else {
          await textureUpload.save(file);
          set("pageTexture", "Uploaded");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "That image didn't load.");
      }
    },
    [set, coverStyle, live],
  );

  const turn = useCallback(
    (dir: 1 | -1) => {
      live();
      driverRef.current.controller.turn(dir);
    },
    [live],
  );

  const { recording, record } = useRecord(driverRef, format, live, setError);

  return (
    <ControlsLayout controls={c}>
      {/* fills the viewport under the bar (and all of it when the bar is hidden, as in thumbnails) */}
      <main className="relative flex min-h-[max(20rem,calc(100dvh-3rem-1px-env(safe-area-inset-top)))] w-full flex-1 flex-col">
        {baked ? (
          <div className="absolute inset-0">
            <MagazineScene book={baked.book} pages={baked.pages} stage={stage} textureImage={textureImage} driverRef={driverRef} />
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
          timelineOpen={timelineOpen}
          onTimeline={() => {
            if (timelineOpen) live();
            setTimelineOpen(!timelineOpen);
          }}
        >
          {timelineOpen && plan && recording === null && (
            <TimelinePanel
              plan={plan}
              driverRef={driverRef}
              overrides={overrides}
              onOverrides={setOverrides}
              onClose={() => {
                live();
                setTimelineOpen(false);
              }}
            />
          )}
        </MagazineControls>
      </main>
    </ControlsLayout>
  );
}
