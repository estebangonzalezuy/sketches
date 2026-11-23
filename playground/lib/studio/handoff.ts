import { appendToStored, loadedWorkspace } from "./workspace";
import type { Project } from "./model/types";

export const STUDIO_SLUG = "studio";

/**
 * Mini tool → Studio: the project opens as a new tab in the Studio, in the Free environment so
 * every tool is on offer there. If the Studio is already loaded on this page (client-side
 * navigation) the tab opens in memory; otherwise it's appended to the Studio's saved workspace.
 */
export function sendToStudio(project: Project, router: { push: (href: string) => void }) {
  const copy: Project = { ...structuredClone(project), environment: "free" };
  const live = loadedWorkspace(STUDIO_SLUG);
  if (live) live.openTab(copy);
  else appendToStored(STUDIO_SLUG, copy);
  router.push(`/prototypes/${STUDIO_SLUG}`);
}
