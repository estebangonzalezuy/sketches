"use client";

import { StudioEditor } from "@/lib/studio/ui/editor";

/** Pixel (shape): one Studio effect on its own, with the full timeline; "Open in Studio" takes it further. */
export function PixelShapeApp() {
  return <StudioEditor slug="pixel-shape" environment="fx:pixel-shape" handoff />;
}
