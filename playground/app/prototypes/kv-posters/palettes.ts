import type { Palette } from "./types";

/** tMSC colour codes (test pairs, not approved yet). */
export const TMSC = {
  Periwinkle: "#ADB4F5", Verde: "#2E7D46", "Marrón": "#3C240C", Ink: "#0C0C0C", Amarillo: "#F4C500",
  Acid: "#E4FC24", Magenta: "#F06CCC", Blanco: "#FFFFFF", Naranja: "#EE4B2B", Lila: "#CC84FC", "Verde osc.": "#0C540C",
} as const;
type Name = keyof typeof TMSC;
export type MonoName = Exclude<Name, "Blanco">;

/** WCAG relative luminance and contrast ratio. */
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [lo, hi] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (hi + 0.05) / (lo + 0.05);
}

/** Type that reads on the paper (WCAG AA, 4.5:1). */
export const TYPE_CONTRAST = 4.5;
/** Minimum separation between a coloured block and the background, and between a block and type laid over it. */
export const MOTIF_CONTRAST = 1.3;
export const BLOCK_TYPE_CONTRAST = 4.5;
/** Colour palettes: type over a block meets AA for large text (3:1); the headline and lockup are large and bold. Lets Verde in. */
export const PALETTE_BLOCK_TYPE_CONTRAST = 3;

/** Motif slot → its natural tMSC colour; a slot whose colour is the figure, too close to the background, or too dark under the type takes a spare. */
const SLOTS = { blue: "Periwinkle", pink: "Magenta", lilac: "Lila", mint: "Verde", orange: "Naranja", yellow: "Amarillo" } as const;
const SPARES: Name[] = ["Acid", "Amarillo", "Periwinkle", "Lila", "Magenta", "Naranja", "Verde"];

/** Paper = background, ink = figure (type, lines); boxes take the background, motifs the rest of the set. */
export function pairPalette(bg: Name, fg: Name): Palette {
  const ok = (n: Name) =>
    n !== fg && n !== bg && contrast(TMSC[n], TMSC[bg]) >= MOTIF_CONTRAST && contrast(TMSC[n], TMSC[fg]) >= PALETTE_BLOCK_TYPE_CONTRAST;
  const spares = SPARES.filter(ok);
  let k = 0;
  const slot = (n: Name) => TMSC[ok(n) ? n : spares[k++ % spares.length]];
  return {
    paper: TMSC[bg], ink: TMSC[fg],
    blue: slot(SLOTS.blue), pink: slot(SLOTS.pink), lilac: slot(SLOTS.lilac),
    mint: slot(SLOTS.mint), orange: slot(SLOTS.orange), yellow: slot(SLOTS.yellow),
    green: TMSC[spares[k++ % spares.length]],
    brown: TMSC[fg],
    cream: TMSC[bg],
  };
}

const blockColours = (p: Palette) => new Set([p.blue, p.pink, p.lilac, p.mint, p.orange, p.yellow]).size;

/** Figure colours that read on white (WCAG AA) and leave at least two block colours. */
export const WHITE_FIGURES = (Object.keys(TMSC) as Name[]).filter(
  (n) => n !== "Blanco" && contrast(TMSC[n], TMSC.Blanco) >= TYPE_CONTRAST && blockColours(pairPalette("Blanco", n)) >= 2,
);

/** White canvas, colourful blocks, one figure colour for type and lines. */
export const PAIR_PALETTES: Record<string, Palette> = Object.fromEntries(WHITE_FIGURES.map((f) => [`Blanco / ${f}`, pairPalette("Blanco", f)]));

// ---------------------------------------------------------------- mono

/** How far a light Mono colour is deepened for type. */
const MONO_INK_CONTRAST = 9;

/** Colours the Mono setting offers. */
export const MONO_COLORS = (Object.keys(TMSC) as Name[]).filter((n) => n !== "Blanco");

const hex = (rgb: number[]) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
const rgbOf = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Mix toward white (t > 0) or black (t < 0). */
export function shade(h: string, t: number): string {
  const to = t > 0 ? 255 : 0;
  return hex(rgbOf(h).map((c) => c + (to - c) * Math.abs(t)));
}

/** One colour on white: the colour and its tints for blocks, type in a deep shade of it. */
export function monoPalette(name: Name): Palette {
  const c = TMSC[name];
  const paper = TMSC.Blanco;
  // type is the colour deepened well past the minimum, so its tints have room to read under it
  let ink: string = c;
  for (let t = 0.05; contrast(ink, paper) < MONO_INK_CONTRAST && t <= 1; t += 0.05) ink = shade(c, -t);
  const ok = (x: string) => contrast(x, paper) >= MOTIF_CONTRAST && contrast(x, ink) >= BLOCK_TYPE_CONTRAST;
  const valid = [...Array.from({ length: 9 }, (_, i) => shade(c, -0.4 + i * 0.05)), ...Array.from({ length: 17 }, (_, i) => shade(c, 0.05 + i * 0.05))]
    .filter(ok)
    .sort((x, y) => luminance(x) - luminance(y));
  // three tones spread across what reads: deepest, middle, lightest
  const tones = valid.length ? [...new Set([valid[0], valid[Math.floor(valid.length / 2)], valid[valid.length - 1]])] : [shade(c, 0.8)];
  const at = (i: number) => tones[i % tones.length];
  return { paper, ink, blue: at(0), pink: at(1), lilac: at(2), mint: at(3), orange: at(4), yellow: at(5), green: at(6), brown: ink, cream: paper };
}
