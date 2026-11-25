import type { Palette } from "./types";

/** tMSC colour codes (test pairs, not approved yet). */
export const TMSC = {
  Periwinkle: "#ADB4F5", Verde: "#2E7D46", "Marrón": "#3C240C", Ink: "#0C0C0C", Amarillo: "#F4C500",
  Acid: "#E4FC24", Magenta: "#F06CCC", Blanco: "#FFFFFF", Naranja: "#EE4B2B", Lila: "#CC84FC", "Verde osc.": "#0C540C",
} as const;
type Name = keyof typeof TMSC;

/** Background / figure pairs from the tMSC sheet (v1 then v2). */
export const PAIRS: [Name, Name][] = [
  ["Periwinkle", "Marrón"], ["Periwinkle", "Verde osc."], ["Amarillo", "Marrón"], ["Naranja", "Marrón"],
  ["Verde", "Acid"], ["Verde", "Magenta"], ["Verde osc.", "Amarillo"], ["Marrón", "Amarillo"],
  ["Marrón", "Periwinkle"], ["Lila", "Naranja"], ["Magenta", "Verde"], ["Acid", "Verde"],
  ["Naranja", "Acid"], ["Ink", "Lila"], ["Ink", "Amarillo"],
  ["Blanco", "Marrón"], ["Blanco", "Verde osc."], ["Blanco", "Naranja"], ["Periwinkle", "Ink"],
  ["Periwinkle", "Naranja"], ["Amarillo", "Ink"], ["Amarillo", "Naranja"], ["Acid", "Marrón"],
  ["Acid", "Verde osc."], ["Lila", "Verde osc."], ["Lila", "Ink"], ["Magenta", "Marrón"],
  ["Magenta", "Ink"], ["Verde osc.", "Periwinkle"], ["Verde osc.", "Acid"], ["Marrón", "Magenta"],
];

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

/** Light backgrounds only, and type that reads on them (WCAG AA, 4.5:1). */
export const LIGHT_BG = 0.3;
export const TYPE_CONTRAST = 4.5;
/** Minimum separation between a coloured block and the background. */
export const MOTIF_CONTRAST = 1.3;

/** Motif slot → its natural tMSC colour; a slot whose colour is the figure or too close to the background takes a spare. */
const SLOTS = { blue: "Periwinkle", pink: "Magenta", lilac: "Lila", mint: "Verde", orange: "Naranja", yellow: "Amarillo" } as const;
const SPARES: Name[] = ["Acid", "Amarillo", "Periwinkle", "Lila", "Magenta", "Naranja", "Verde"];

/** Paper = background, ink = figure (type, lines); boxes take the background, motifs the rest of the set. */
export function pairPalette(bg: Name, fg: Name): Palette {
  const ok = (n: Name) => n !== fg && n !== bg && contrast(TMSC[n], TMSC[bg]) >= MOTIF_CONTRAST;
  const spares = SPARES.filter(ok);
  let k = 0;
  const slot = (n: Name) => TMSC[ok(n) ? n : spares[k++ % spares.length]];
  return {
    paper: TMSC[bg], ink: TMSC[fg],
    blue: slot(SLOTS.blue), pink: slot(SLOTS.pink), lilac: slot(SLOTS.lilac),
    mint: slot(SLOTS.mint), orange: slot(SLOTS.orange), yellow: slot(SLOTS.yellow),
    green: TMSC[fg === "Verde osc." ? "Verde" : "Verde osc."],
    brown: TMSC[fg === "Marrón" ? "Ink" : "Marrón"],
    cream: TMSC[bg],
  };
}

const usable = ([b, f]: [Name, Name]) => luminance(TMSC[b]) >= LIGHT_BG && contrast(TMSC[b], TMSC[f]) >= TYPE_CONTRAST;

export const PAIR_PALETTES: Record<string, Palette> = Object.fromEntries(PAIRS.filter(usable).map(([b, f]) => [`${b} / ${f}`, pairPalette(b, f)]));
