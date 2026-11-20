import { clamp01, ease } from "./easing";
import { intersect, type Channels } from "./channels";
import type { Behavior, Box } from "./types";

export type Stage = { width: number; height: number };

/** Local 0–1 progress of a behavior inside its window of the Progress slider. */
export function localProgress(b: Pick<Behavior, "start" | "end">, p: number): number {
  if (b.end - b.start <= 1e-6) return p >= b.start ? 1 : 0;
  return clamp01((p - b.start) / (b.end - b.start));
}

/**
 * Adds one behavior to a layer's channels. Every behavior is a pure function of local
 * progress and reaches the resting poster at u = 1 (drift also rests at u = 0).
 */
export function applyBehavior(ch: Channels, b: Behavior, p: number, box: Box, stage: Stage) {
  const u = localProgress(b, p);
  const left = 1 - ease("out", u);
  const a = b.amount;
  const horizontal = b.dir === "left" || b.dir === "right";
  const sign = b.dir === "up" || b.dir === "left" ? 1 : -1;
  switch (b.kind) {
    case "fade":
      ch.alpha *= 1 - a * left;
      break;
    case "slide": {
      // "up" arrives moving up, so it starts below its place
      const dist = a * 0.5 * (horizontal ? stage.width : stage.height) * left * sign;
      if (horizontal) ch.dx += dist;
      else ch.dy += dist;
      break;
    }
    case "wipe":
      // fully shown = no clip at all, so ink that spills past the box is never cut at rest
      if (a * left > 1e-4) ch.clip = intersect(ch.clip, wipeBox(box, b.dir, 1 - a * left, stage));
      break;
    case "grow":
      ch.scale *= 1 - a * left;
      break;
    case "spin":
      ch.rotate += -sign * a * 360 * left;
      break;
    case "pixel":
      ch.pixel = Math.max(ch.pixel, a * 18 * (stage.width / 1080) * left);
      break;
    case "drift": {
      const off = a * 0.03 * Math.min(stage.width, stage.height) * Math.sin(2 * Math.PI * u) * sign;
      if (horizontal) ch.dx += off;
      else ch.dy += off;
      break;
    }
  }
}

/** The visible part of a layer box, `shown` 0–1, growing towards `dir`. The other axis is left open. */
export function wipeBox(box: Box, dir: Behavior["dir"], shown: number, stage: Stage): Box {
  const s = clamp01(shown);
  const m = Math.max(box.w, box.h) * 0.04; // ink margin around the measured box
  box = { x: box.x - m, y: box.y - m, w: box.w + 2 * m, h: box.h + 2 * m };
  const pad = Math.max(stage.width, stage.height);
  const open = { x: -pad, y: -pad, w: stage.width + 2 * pad, h: stage.height + 2 * pad };
  switch (dir) {
    case "right":
      return { ...open, x: box.x, w: box.w * s };
    case "left":
      return { ...open, x: box.x + box.w * (1 - s), w: box.w * s };
    case "down":
      return { ...open, y: box.y, h: box.h * s };
    case "up":
      return { ...open, y: box.y + box.h * (1 - s), h: box.h * s };
  }
}
