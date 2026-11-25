import raw from "./content.json";
import type { Interview, Quote } from "./types";

/** The four interviews, newest first, straight from content.json (the source of truth). */
export const INTERVIEWS = raw.interviews as Interview[];

/** Printed on the back cover. Redirects to humanandmotion.substack.com, where the posts live. */
export const PUBLICATION_URL = "themotionsocialclub.substack.com";

export function interview(order: 1 | 2 | 3 | 4): Interview {
  const found = INTERVIEWS.find((i) => i.order === order);
  if (!found) throw new Error(`No interview ${order}`);
  return found;
}

/** "Be ready when the opportunity arrives w/Victor Verdugo" → "Be ready when the opportunity arrives". */
export function pageTitle(i: Interview): string {
  return i.title.replace(/\s+w\/.*$/i, "").trim();
}

/** Short series label: "Voice File (transcript format…)" → "Voice File". */
export function seriesLabel(i: Interview): string {
  return (i.series ?? "").replace(/\s*\(.*\)\s*$/, "").trim();
}

/** Role without asides: "Director, co-founder of Noodle (with Steph…)" → "Director, co-founder of Noodle". */
export function roleLabel(i: Interview): string {
  return (i.guest_role ?? "").replace(/\s*\(.*\)\s*$/, "").replace(/;\s*/g, ", ").trim();
}

/** Day and month only, in Madrid time, never the year: "17 Nov". */
export function displayDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "numeric", timeZone: "Europe/Madrid" }).formatToParts(new Date(iso));
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = Number(parts.find((p) => p.type === "month")?.value ?? 1);
  return `${Number(day)} ${MONTHS[month - 1]}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function heroQuote(i: Interview, index: number): Quote {
  const q = i.quotes[index];
  if (!q || q.attribution !== i.guest) throw new Error(`Quote ${index} of ${i.guest} is missing or misattributed`);
  return q;
}
