"use client";

import { StudioEditor } from "@/lib/studio/ui/editor";

/** Wave: one Studio effect on its own, with the full timeline; "Open in Studio" takes it further. */
export function WaveApp() {
  return <StudioEditor slug="wave" environment="fx:wave" handoff />;
}
