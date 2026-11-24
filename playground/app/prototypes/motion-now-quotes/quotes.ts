/** Quote parsing and the typing timeline. Pure. */
import { PAUSE } from "./data";
import type { LiveQuote, Quote } from "./types";

export function parseQuotes(text: string): { ok: true; value: Quote[] } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, error: "Expected a non-empty array of quotes." };
  if (raw.length > 200) return { ok: false, error: "Up to 200 quotes." };
  const out: Quote[] = [];
  for (let i = 0; i < raw.length; i++) {
    const q = raw[i] as Record<string, unknown>;
    const where = `Quote ${i + 1}`;
    if (!q || typeof q.text !== "string" || !q.text.trim()) return { ok: false, error: `${where}: "text" is required.` };
    if (typeof q.role !== "string") return { ok: false, error: `${where}: "role" must be text (never a name).` };
    if (typeof q.years !== "number" || q.years < 0) return { ok: false, error: `${where}: "years" must be a number.` };
    out.push({
      text: q.text.trim().slice(0, 400),
      role: q.role.slice(0, 40),
      years: Math.round(q.years),
      ...(typeof q.keyword === "string" && q.keyword ? { keyword: q.keyword } : {}),
    });
  }
  return { ok: true, value: out };
}

export const sanitizeQuotes = (raw: unknown) => {
  const r = parseQuotes(JSON.stringify(raw ?? null));
  return r.ok ? r.value : undefined;
};

/** "Freelance, 8 yrs" */
export const attribution = (q: Quote) => `${q.role}, ${q.years} ${q.years === 1 ? "yr" : "yrs"}`;

/** Seconds one quote occupies in the feed: typing plus the pause after it. */
export const typingTime = (q: Quote, msPerChar: number) => (q.text.length * msPerChar) / 1000;

/**
 * The live feed at time t: quotes type one after another, cycling through the list forever.
 * Returns the last `max` quotes that have started, oldest first.
 */
export function feedAt(quotes: readonly Quote[], t: number, msPerChar: number, max: number): LiveQuote[] {
  if (!quotes.length || t < 0) return [];
  const slots = quotes.map((q) => typingTime(q, msPerChar) + PAUSE);
  const cycle = slots.reduce((s, d) => s + d, 0);
  const lap = Math.floor(t / cycle);
  let start = lap * cycle;
  let k = lap * quotes.length;
  while (start + slots[k % quotes.length] <= t) start += slots[k++ % quotes.length];
  const out: LiveQuote[] = [];
  for (let j = k, s = start; j >= 0 && out.length < max; j--) {
    const quote = quotes[j % quotes.length];
    const typed = Math.min(quote.text.length, Math.floor(((t - s) * 1000) / msPerChar));
    out.unshift({ key: j, quote, typed, start: s });
    if (j > 0) s -= slots[(j - 1) % quotes.length];
  }
  return out;
}
