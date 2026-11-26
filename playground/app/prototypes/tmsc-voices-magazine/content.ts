import raw from "./content.json";
import type { Interview } from "./types";

/** The four interviews of the first issue (content.json), still the default magazine. */
export const INTERVIEWS = raw.interviews as Interview[];

/** Printed on the back cover. Redirects to humanandmotion.substack.com, where the posts live. */
export const PUBLICATION_URL = "themotionsocialclub.substack.com";

/** Day and month only, in Madrid time, never the year: "17 Nov". */
export function displayDate(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "numeric", timeZone: "Europe/Madrid" }).formatToParts(new Date(iso));
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = Number(parts.find((p) => p.type === "month")?.value ?? 1);
  return `${Number(day)} ${MONTHS[month - 1]}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
