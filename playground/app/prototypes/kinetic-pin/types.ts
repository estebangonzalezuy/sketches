import type { ControlValues } from "@/components/controls";
import type { controls } from "./data";

export type Settings = ControlValues<typeof controls>;
export type Pt = [number, number];
/** Corners in canvas px, in order: top-left, top-right, bottom-right, bottom-left. */
export type Quad = [Pt, Pt, Pt, Pt];
