/** Reads design tokens for canvas drawing. Canvas can't use Tailwind classes, so it reads the CSS variables. */
export type CanvasColors = { background: string; foreground: string };

export function readCanvasColors(el: Element = document.documentElement): CanvasColors {
  const style = getComputedStyle(el);
  return {
    background: style.getPropertyValue("--background").trim() || "Canvas",
    foreground: style.getPropertyValue("--foreground").trim() || "CanvasText",
  };
}
