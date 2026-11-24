/** Canvas text helpers: wrapping by measured width. Needs a 2D context but no DOM. */
type Measure = { measureText(text: string): { width: number } };

/** Greedy word wrap. Explicit "\n" starts a new line. */
export function wrap(ctx: Measure, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

/** Largest font size (from `max` down) whose wrapped text fits in `maxLines`. */
export function fitSize(
  ctx: Measure & { font: string },
  text: string,
  maxWidth: number,
  maxLines: number,
  max: number,
  min: number,
  fontFor: (size: number) => string,
): number {
  for (let s = max; s > min; s *= 0.94) {
    ctx.font = fontFor(s);
    if (wrap(ctx, text, maxWidth).length <= maxLines) return s;
  }
  return min;
}
