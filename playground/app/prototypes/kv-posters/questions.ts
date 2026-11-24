import type { Element, Poster } from "./types";

export interface Questions {
  /** the survey's questions, in order (numbered from 1) */
  list: string[];
  /** typed into the headline box before it constructs into the title */
  lead: string;
}

/** Placeholders until the real survey questions are pasted in. */
export const DEFAULT_QUESTIONS: Questions = {
  lead: "What does motion mean now?",
  list: [
    "What do you make, mostly?",
    "How long have you been working in motion?",
    "Which tools do you open every day?",
    "What is slowing your work down?",
    "Where do you find new work?",
    "What would you learn next?",
  ],
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Which question each element types before it is built. The headline gets the lead question;
 * the rest take the survey's questions in order, biggest boxes first, wrapping round the list.
 * Pure: sizes are estimated from the model, no DOM.
 */
export function assignQuestions(p: Poster, q: Questions): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const list = q.list.map((s) => s.trim()).filter(Boolean);
  for (const e of p.elements) if (e.kind === "headline" && q.lead.trim()) out.set(e.id, ["Q00", q.lead.trim()]);
  if (!list.length) return out;
  const rest = p.elements
    .filter((e) => e.kind !== "headline")
    .map((e) => ({ e, a: area(e) }))
    .sort((a, b) => b.a - a.a);
  rest.forEach(({ e }, i) => {
    const n = i % list.length;
    out.set(e.id, [`Q${pad(n + 1)} / ${pad(list.length)}`, list[n]]);
  });
  return out;
}

/** Rough footprint, only used to hand the first questions to the biggest boxes. */
function area(e: Element): number {
  switch (e.kind) {
    case "block":
    case "bands":
      return e.w * e.h;
    case "flower":
    case "spiral":
      return 4 * e.r * e.r;
    case "mark":
      return 4.4 * e.size * e.size;
    case "lockup":
      return 12 * e.size * e.size;
    case "headline":
      return 0;
  }
}
