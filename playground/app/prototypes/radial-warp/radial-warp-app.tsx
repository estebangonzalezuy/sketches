"use client";

import { StudioEditor } from "@/lib/studio/ui/editor";

/** Radial Warp: one Studio effect on its own, with the full timeline; "Open in Studio" takes it further. */
export function RadialWarpApp() {
  return <StudioEditor slug="radial-warp" environment="fx:radial-warp" handoff />;
}
