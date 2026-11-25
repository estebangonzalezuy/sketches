/**
 * The stage (the table the magazine lies on) follows the playground theme: it reads the design
 * tokens from CSS. Tokens can be oklch() and can carry alpha, which three.js can't parse, so
 * each is painted over the field color on a 1×1 canvas and read back as opaque sRGB.
 */
export type StageColors = { field: string; line: string; mark: string };

function resolve(css: string, under: string | null, fallback: string): string {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  if (under) {
    g.fillStyle = under;
    g.fillRect(0, 0, 1, 1);
  }
  g.fillStyle = fallback;
  g.fillStyle = css || fallback;
  g.fillRect(0, 0, 1, 1);
  const [r, gr, b] = g.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${gr}, ${b})`;
}

export function readStageColors(el: Element = document.documentElement): StageColors {
  const s = getComputedStyle(el);
  const v = (name: string) => s.getPropertyValue(name).trim();
  const field = resolve(v("--background"), null, "Canvas");
  return {
    field,
    line: resolve(v("--border"), field, "GrayText"),
    mark: resolve(v("--muted-foreground"), field, "GrayText"),
  };
}
