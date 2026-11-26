import type { PageFace } from "./types";

/**
 * The page order, as saddle-stitched sheets. Spread k shows the back of sheet k−1 (left) and
 * the front of sheet k (right). Each feature gets its intro spread (subject, image, hero
 * quote) and, with Q&A pages on, a second spread of the article in columns.
 */

export type Book = { faces: PageFace[]; sheets: number; spreadNames: string[] };

export function buildBook(features: { id: string; guest: string }[], editorial: boolean): Book {
  const pages: Omit<PageFace, "sheet" | "side" | "folio">[] = [{ id: "cover", layout: "cover" }];
  const names = ["Cover"];
  features.forEach((f, i) => {
    pages.push({ id: `${f.id}-a`, layout: "interview-left", feature: i });
    pages.push({ id: `${f.id}-b`, layout: "interview-right", feature: i });
    names.push(f.guest);
    if (editorial) {
      pages.push({ id: `${f.id}-text-a`, layout: "editorial-left", feature: i });
      pages.push({ id: `${f.id}-text-b`, layout: "editorial-right", feature: i });
      names.push(`${f.guest}, Q&A`);
    }
  });
  pages.push({ id: "back-cover", layout: "back-cover" });
  names.push("Back cover");
  const faces = pages.map((p, i) => ({ ...p, sheet: Math.floor(i / 2), side: i % 2 === 0 ? "front" : "back", folio: i + 1 }) as PageFace);
  return { faces, sheets: faces.length / 2, spreadNames: names };
}
