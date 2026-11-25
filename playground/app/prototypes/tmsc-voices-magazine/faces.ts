import type { PageFace } from "./types";

/**
 * The page order, as saddle-stitched sheets. Spread k shows the back of sheet k−1 (left) and
 * the front of sheet k (right). Each interview gets its intro spread (name, image, hero
 * quote) and, with editorial pages on, a second spread of the conversation in columns.
 */

const GUESTS = [
  { order: 1, id: "victor", name: "Victor Verdugo" },
  { order: 2, id: "thais", name: "Thais Macedo" },
  { order: 3, id: "doug", name: "Doug Alberts" },
  { order: 4, id: "justin", name: "Justin Cone" },
] as const;

export type Book = { faces: PageFace[]; sheets: number; spreadNames: string[] };

export function buildBook(editorial: boolean): Book {
  const pages: Omit<PageFace, "sheet" | "side" | "folio">[] = [{ id: "cover", layout: "cover" }];
  const names = ["Cover"];
  for (const g of GUESTS) {
    pages.push({ id: `${g.id}-a`, layout: "interview-left", interviewOrder: g.order });
    pages.push({ id: `${g.id}-b`, layout: "interview-right", interviewOrder: g.order });
    names.push(g.name);
    if (editorial) {
      pages.push({ id: `${g.id}-text-a`, layout: "editorial-left", interviewOrder: g.order });
      pages.push({ id: `${g.id}-text-b`, layout: "editorial-right", interviewOrder: g.order });
      names.push(`${g.name}, Q&A`);
    }
  }
  pages.push({ id: "back-cover", layout: "back-cover" });
  names.push("Back cover");
  const faces = pages.map((p, i) => ({ ...p, sheet: Math.floor(i / 2), side: i % 2 === 0 ? "front" : "back", folio: i + 1 }) as PageFace);
  return { faces, sheets: faces.length / 2, spreadNames: names };
}
