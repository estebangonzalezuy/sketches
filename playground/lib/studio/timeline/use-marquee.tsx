"use client";

import { useRef, useState } from "react";
import { useStudio } from "../ui/context";

type Box = { x0: number; y0: number; x1: number; y1: number };

/**
 * Box selection on the lanes: drag on empty lane space to select every key the box touches
 * (shift adds to the selection). A click on empty space clears the key selection.
 */
export function useMarquee() {
  const { sel, setSel } = useStudio();
  const [box, setBox] = useState<Box | null>(null);
  const start = useRef<{ x: number; y: number; base: Set<string>; el: HTMLElement } | null>(null);

  const select = (b: Box, el: HTMLElement, base: Set<string>) => {
    const r = el.getBoundingClientRect();
    const [l, rt] = [Math.min(b.x0, b.x1) + r.left, Math.max(b.x0, b.x1) + r.left];
    const [t, bt] = [Math.min(b.y0, b.y1) + r.top, Math.max(b.y0, b.y1) + r.top];
    const ids = new Set(base);
    el.querySelectorAll<HTMLElement>("[data-key]").forEach((k) => {
      const kr = k.getBoundingClientRect();
      const cx = kr.left + kr.width / 2;
      const cy = kr.top + kr.height / 2;
      if (cx >= l && cx <= rt && cy >= t && cy <= bt) ids.add(k.dataset.key!);
    });
    setSel({ keys: ids });
  };

  return {
    handlers: {
      onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (!(e.target as HTMLElement).dataset.lane) return;
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        el.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX - r.left, y: e.clientY - r.top, base: e.shiftKey ? new Set(sel.keys) : new Set(), el };
      },
      onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        const s = start.current;
        if (!s) return;
        const r = s.el.getBoundingClientRect();
        const b = { x0: s.x, y0: s.y, x1: e.clientX - r.left, y1: e.clientY - r.top };
        if (Math.hypot(b.x1 - b.x0, b.y1 - b.y0) < 4) return;
        setBox(b);
        select(b, s.el, s.base);
      },
      onPointerUp() {
        if (start.current && !box) setSel({ keys: start.current.base });
        start.current = null;
        setBox(null);
      },
    },
    box: box && (
      <div
        className="pointer-events-none absolute z-20 border border-primary bg-primary/10"
        style={{ left: Math.min(box.x0, box.x1), top: Math.min(box.y0, box.y1), width: Math.abs(box.x1 - box.x0), height: Math.abs(box.y1 - box.y0) }}
      />
    ),
  };
}
