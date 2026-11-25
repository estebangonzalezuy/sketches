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

/** Motif slot → its natural tMSC colour; spares fill a slot whose colour is taken by the pair. */
const SLOTS = { blue: "Periwinkle", pink: "Magenta", lilac: "Lila", mint: "Verde", orange: "Naranja", yellow: "Amarillo" } as const;
const SPARES: Name[] = ["Acid", "Amarillo", "Periwinkle", "Lila", "Magenta", "Naranja", "Verde"];

/** Paper = background, ink = figure (type, lines); motifs use the rest of the set. */
export function pairPalette(bg: Name, fg: Name): Palette {
  const spares = SPARES.filter((n) => n !== bg && n !== fg);
  const slot = (n: Name) => TMSC[n === bg || n === fg ? spares.shift()! : n];
  return {
    paper: TMSC[bg], ink: TMSC[fg],
    blue: slot(SLOTS.blue), pink: slot(SLOTS.pink), lilac: slot(SLOTS.lilac),
    mint: slot(SLOTS.mint), orange: slot(SLOTS.orange), yellow: slot(SLOTS.yellow),
    green: TMSC[bg === "Verde osc." ? "Verde" : "Verde osc."],
    brown: TMSC[bg === "Marrón" ? fg : "Marrón"],
    cream: TMSC[bg],
  };
}

export const PAIR_PALETTES: Record<string, Palette> = Object.fromEntries(PAIRS.map(([b, f]) => [`${b} / ${f}`, pairPalette(b, f)]));
