import type { RefObject } from "react";
import type { RootState } from "@react-three/fiber";
import { FlipController } from "./flip-controller";
import type { SheetPose } from "./types";

export type ApplyPoses = (poses: SheetPose[], drop: number, shadow: number, time: number) => void;

/**
 * Mutable bridge between React (buttons, keys, Record) and the render loop. Lives in a ref so
 * nothing here ever causes a re-render or restarts the loop.
 */
export class Driver {
  controller = new FlipController();
  /** While true the live loop stands still and Record renders frames itself. */
  recording = false;
  time = 0;
  apply: ApplyPoses | null = null;
  onFrame: (() => void) | null = null;
  /** Reads the live three.js state (renderer, scene, camera); set from inside the Canvas. */
  three: (() => RootState) | null = null;
}

export type DriverRef = RefObject<Driver>;
