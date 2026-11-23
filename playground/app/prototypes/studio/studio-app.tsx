"use client";

import { StudioEditor } from "@/lib/studio/ui/editor";

/** The Studio: every environment, in project tabs. */
export function StudioApp() {
  return <StudioEditor slug="studio" tabs />;
}
