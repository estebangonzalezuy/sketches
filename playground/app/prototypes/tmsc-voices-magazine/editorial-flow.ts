import raw from "./editorial.json";

/**
 * Flows an interview's questions and answers through column frames on two pages. Text is
 * never cut mid-sentence: whole paragraphs go in, and the last answer may stop at the end of
 * a sentence to fill the space. A question never ends the text without its answer.
 */

export type Block = { kind: "q" | "a"; text: string };
export type Frame = { page: 0 | 1; x: number; y: number; w: number; h: number };
export type Line = { page: 0 | 1; x: number; y: number; text: string; bold: boolean };
export type Measure = (text: string, bold: boolean) => number;

export const EDITORIAL = raw.interviews as unknown as Record<"1" | "2" | "3" | "4", Block[]>;

export function wrapWords(text: string, width: number, measure: (s: string) => number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > width) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/** Places blocks into frames in order. `lead` is the line height, `gap` the space between paragraphs. */
export function flow(blocks: Block[], frames: Frame[], lead: number, gap: number, measure: Measure): { lines: Line[]; placed: number; partial: boolean } {
  const lines: Line[] = [];
  let f = 0;
  let y = frames[0]?.y ?? 0;
  let placed = 0;
  let lastQuestion: { lines: number; f: number; y: number } | null = null;

  // where each line of `text` would land from the current position, or null if it runs out
  const tryPlace = (text: string, bold: boolean) => {
    const wrapped = wrapWords(text, frames[f].w, (s) => measure(s, bold));
    let ff = f;
    let yy = y;
    const pos: { f: number; y: number }[] = [];
    for (let i = 0; i < wrapped.length; i++) {
      while (frames[ff] && yy + lead > frames[ff].y + frames[ff].h) {
        ff++;
        yy = frames[ff]?.y ?? 0;
      }
      if (!frames[ff]) return null;
      pos.push({ f: ff, y: yy });
      yy += lead;
    }
    return { wrapped, pos, ff, yy };
  };

  let partial = false;
  for (const block of blocks) {
    const bold = block.kind === "q";
    if (!frames[f]) break;
    let fit = tryPlace(block.text, bold);
    if (!fit && !bold) {
      // the last answer: keep as many whole sentences as fit
      const sentences = block.text.split(/(?<=[.!?…])\s+/);
      for (let n = sentences.length - 1; n > 0 && !fit; n--) fit = tryPlace(sentences.slice(0, n).join(" "), bold);
      partial = !!fit;
    }
    if (!fit) break;
    const { wrapped, pos, ff, yy } = fit;
    const before = { lines: lines.length, f, y };
    wrapped.forEach((text, i) => {
      const fr = frames[pos[i].f];
      lines.push({ page: fr.page, x: fr.x, y: pos[i].y, text, bold });
    });
    f = ff;
    y = yy + gap;
    placed++;
    lastQuestion = bold ? before : null;
    if (partial) break;
  }
  // never leave a question hanging at the end
  if (lastQuestion) {
    lines.length = lastQuestion.lines;
    placed--;
  }
  return { lines, placed, partial };
}

/** Equal columns across a box. */
export function columns(page: 0 | 1, x: number, y: number, w: number, h: number, count: number, gutter: number): Frame[] {
  const cw = (w - gutter * (count - 1)) / count;
  return Array.from({ length: count }, (_, i) => ({ page, x: x + i * (cw + gutter), y, w: cw, h }));
}
