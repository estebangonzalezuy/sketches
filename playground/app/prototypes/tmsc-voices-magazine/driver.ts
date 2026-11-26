import type { RefObject } from "react";
import type { RootState } from "@react-three/fiber";
import type { Book } from "./faces";
import { DEFAULT_CAMERA, viewAt, type CameraSetup, type View } from "./camera";
import { FlipController } from "./flip-controller";
import { recordPlan, type RecordPlan } from "./timeline";
import { DEFAULT_TIMING, type Timing } from "./timing";
import type { SheetPose } from "./types";

export type ApplyPoses = (poses: SheetPose[], drop: number, shadow: number, time: number) => void;

/**
 * Mutable bridge between React (buttons, keys, Record) and the render loop. Lives in a ref so
 * nothing here ever causes a re-render or restarts the loop.
 */
export class Driver {
  controller = new FlipController(0);
  /** The page order the meshes were built from. */
  book: Book | null = null;
  /** While true the live loop stands still and Record renders frames itself. */
  recording = false;
  time = 0;
  apply: ApplyPoses | null = null;
  onFrame: (() => void) | null = null;
  /** Reads the live three.js state (renderer, scene, camera); set from inside the Canvas. */
  three: (() => RootState) | null = null;
  timing: Timing = DEFAULT_TIMING;
  camera: CameraSetup = DEFAULT_CAMERA;
  /** The Record sequence for the current pages and timing. */
  plan: RecordPlan | null = null;
  /** While set, the scene shows the Record sequence at `t` (the timeline's scrub / play). */
  preview: { t: number; playing: boolean } | null = null;
  onPreview: ((t: number | null) => void) | null = null;

  setTiming(timing: Timing) {
    this.timing = timing;
    this.controller.timing = timing;
    this.plan = this.book ? recordPlan(this.book, timing) : null;
  }

  /** The camera at time t of the Record sequence, or the base view when t is null (live). */
  view(t: number | null): View {
    const c = this.camera;
    return t === null || !this.plan ? { tilt: c.tilt, yaw: c.yaw, zoom: c.zoom } : viewAt(c, t, this.plan.duration);
  }

  /** Back to live: the magazine stays open on the spread the preview was showing. */
  endPreview(turned: number | null) {
    if (!this.preview) return;
    this.preview = null;
    if (turned !== null) this.controller.jumpTo(turned);
    this.onPreview?.(null);
  }

  /** Adopts a freshly baked page order. A different sheet count starts again from the cover. */
  useBook(book: Book) {
    if (this.controller.count !== book.sheets) {
      const reduced = this.controller.reduced;
      this.controller = new FlipController(book.sheets);
      this.controller.reduced = reduced;
    }
    this.book = book;
    this.setTiming(this.timing);
  }
}

export type DriverRef = RefObject<Driver>;
