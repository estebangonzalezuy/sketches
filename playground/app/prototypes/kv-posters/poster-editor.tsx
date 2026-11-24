"use client";

import { useEffect, useState } from "react";
import { ImageDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Controls } from "@/components/controls";
import { animate, clipsFor } from "./animate";
import { AnimatePanel } from "./animate-panel";
import { moved } from "./bounds";
import { controls, PALETTES } from "./data";
import { DesignPanel } from "./design-panel";
import { exportMP4 } from "./export-mp4";
import { PosterCanvas } from "./poster-canvas";
import { render } from "./render";
import { canRedo, canUndo, editPoster, redo, setEase, undo, useEase, usePoster } from "./store";
import type { AnimStyle, Clip, Element, FormatId, Paint, Poster } from "./types";
import { usePlayhead } from "./use-playhead";
import { useReducedMotion } from "./use-reduced-motion";

export function PosterEditor({ c }: { c: Controls<typeof controls> }) {
  const v = c.values;
  const opts = { template: v.template, seed: v.seed, format: v.format as FormatId, density: v.density, paint: v.color as Paint };
  const poster = usePoster(opts);
  const palette = PALETTES[v.palette] ?? PALETTES.Pastel;
  const [tab, setTab] = useState("design");
  const [selected, setSelected] = useState<string | null>(null);
  const fps = Number(v.fps);
  const grain = v.paper ? v.grain : 0;
  const curve = useEase();
  const settings = { style: v.style as AnimStyle, duration: v.duration, stagger: v.stagger, turns: v.turns, ease: curve };
  const reduced = useReducedMotion();
  const ph = usePlayhead(v.duration, fps, !reduced);
  const edit = (fn: (p: Poster) => Poster, group?: string) => editPoster(opts, poster, fn, group);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, [role=slider]")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === "Escape") setSelected(null);
      else if ((e.key === "Backspace" || e.key === "Delete") && selected && tab === "design") {
        e.preventDefault();
        editPoster(opts, poster, (p) => ({ ...p, elements: p.elements.filter((x) => x.id !== selected) }));
        setSelected(null);
      } else if (e.key === " " && tab === "animate") {
        e.preventDefault();
        ph.toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const png = () => {
    const cv = document.createElement("canvas");
    cv.width = poster.width;
    cv.height = poster.height;
    render(cv.getContext("2d")!, poster, palette, { scale: 1, grain });
    cv.toBlob((b) => b && download(b, `motion-now-${v.seed}.png`), "image/png");
  };

  return (
    <main className="mx-auto grid w-full max-w-2xl gap-4 px-4 py-4 lg:py-6">
      <div className="mx-auto w-full max-w-md">
        <PosterCanvas
          poster={poster}
          palette={palette}
          grain={grain}
          anim={tab === "animate" ? animate(poster, ph.t, settings) : undefined}
          selected={selected}
          onSelect={setSelected}
          interactive
          onMove={(id, dx, dy) => tab === "design" && edit((p) => ({ ...p, elements: p.elements.map((e) => (e.id === id ? moved(e as Element, dx, dy) : e)) }), `move:${id}`)}
        />
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="animate">Animate</TabsTrigger>
          </TabsList>
          <Button variant="outline" aria-label="Download PNG" onClick={png} className="size-11 sm:w-auto sm:px-3">
            <ImageDownIcon />
            <span className="hidden sm:inline">PNG</span>
          </Button>
        </div>
        <TabsContent value="design" className="pt-2">
          <DesignPanel
            poster={poster}
            palette={palette}
            selected={selected}
            a={{ newPoster: () => (c.set("seed", 1 + Math.floor(Math.random() * 9998)), setSelected(null)), edit, undo, redo, canUndo: canUndo(), canRedo: canRedo(), select: setSelected }}
          />
        </TabsContent>
        <TabsContent value="animate" className="pt-2">
          <AnimatePanel
            {...ph}
            duration={v.duration}
            fps={fps}
            ease={curve}
            setEase={setEase}
            poster={poster}
            clips={clipsFor(poster, settings)}
            selected={selected}
            onSelect={setSelected}
            onClip={(id, c: Clip | null, group) => edit((p) => ({ ...p, elements: p.elements.map((e) => (e.id === id ? ({ ...e, anim: c ?? undefined } as Element) : e)) }), group)}
            onExport={async (onProgress, signal) => download(await exportMP4(poster, palette, grain, settings, fps, onProgress, signal), `motion-now-${v.seed}.mp4`)}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function download(b: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
