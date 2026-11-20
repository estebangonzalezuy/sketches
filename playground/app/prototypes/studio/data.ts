import { defineControls } from "@/components/controls";

export const SLUG = "studio";

/** Viewer preferences (not part of the project, so not undoable). */
export const controls = defineControls({
  quality: { type: "select", label: "Preview quality", options: ["full", "half"], default: "full", randomize: false },
  paths: { type: "boolean", label: "Motion paths", default: true, randomize: false },
  handles: { type: "boolean", label: "Effect handles", default: true, randomize: false },
});
