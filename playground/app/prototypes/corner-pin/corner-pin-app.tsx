"use client";

import { StudioEditor } from "@/lib/studio/ui/editor";

/** Corner Pin: one Studio effect on its own, with the full timeline; "Open in Studio" takes it further. */
export function CornerPinApp() {
  return <StudioEditor slug="corner-pin" environment="fx:corner-pin" handoff />;
}
