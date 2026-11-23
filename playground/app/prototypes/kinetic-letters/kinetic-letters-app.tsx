"use client";

import { StudioEditor } from "@/lib/studio/ui/editor";

/** Kinetic Letters: one Studio effect on its own, with the full timeline; "Open in Studio" takes it further. */
export function KineticLettersApp() {
  return <StudioEditor slug="kinetic-letters" environment="fx:letters" handoff />;
}
