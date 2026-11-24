"use client";

import { useEffect, useRef } from "react";
import type { AnimFrame } from "./animate";
import { bounds, hit } from "./bounds";
import { render } from "./render";
import type { Element, Palette, Poster } from "./types";

/**
 * The poster, scaled to fit. In design mode: tap selects the front-most element, drag moves it
 * (one undo step per drag). In animate mode it just plays.
 */
export function PosterCanvas({
  poster, palette, grain, anim, selected, onSelect, onMove, interactive,
}: {
  poster: Poster;
  palette: Palette;
  grain: number;
  anim?: AnimFrame;
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** live drag; `commit` is true on the first move of a gesture */
  onMove: (id: string, dx: number, dy: number, commit: boolean) => void;
  interactive: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);

  useEffect(() => {
    const cv = ref.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(cv.clientWidth * dpr));
    if (cv.width !== w) {
      cv.width = w;
      cv.height = Math.round((w * poster.height) / poster.width);
    }
    render(cv.getContext("2d")!, poster, palette, { scale: cv.width / poster.width, grain, anim });
  });

  const toPoster = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * poster.width, y: ((e.clientY - r.top) / r.height) * poster.height };
  };

  const sel: Element | undefined = interactive ? poster.elements.find((e) => e.id === selected) : undefined;
  const b = sel ? bounds(sel) : null;

  return (
    <div className="relative w-full overflow-hidden rounded-md border border-border" style={{ aspectRatio: `${poster.width} / ${poster.height}` }}>
      <canvas
        ref={ref}
        aria-label="Poster"
        className="block size-full touch-none"
        onPointerDown={(e) => {
          if (!interactive) return;
          const pt = toPoster(e);
          const h = hit(poster.elements, pt.x, pt.y);
          onSelect(h?.id ?? null);
          if (h) {
            drag.current = { id: h.id, ...pt, moved: false };
            e.currentTarget.setPointerCapture(e.pointerId);
          }
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const pt = toPoster(e);
          if (!d.moved && Math.hypot(pt.x - d.x, pt.y - d.y) < 4) return;
          onMove(d.id, pt.x - d.x, pt.y - d.y, !d.moved);
          drag.current = { ...d, ...pt, moved: true };
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      />
      {b && (
        <div
          data-capture-hide
          className="pointer-events-none absolute rounded-xs outline-2 outline-ring outline-dashed"
          style={{ left: `${(b.x / poster.width) * 100}%`, top: `${(b.y / poster.height) * 100}%`, width: `${(b.w / poster.width) * 100}%`, height: `${(b.h / poster.height) * 100}%` }}
        />
      )}
    </div>
  );
}
