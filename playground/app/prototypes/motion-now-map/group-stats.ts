/** The three key numbers shown for a zoomed-in group. Pure. */
import { mean, median, sorted } from "@/lib/tmsc/stats";
import type { Respondent } from "@/lib/tmsc/survey";

export type KeyNumber = { value: string; caption: string };

export function keyNumbers(group: readonly Respondent[]): KeyNumber[] {
  const rate = median(sorted(group.map((r) => r.dayRate)));
  const ai = group.filter((r) => r.ai === "Weekly" || r.ai === "Daily").length / Math.max(1, group.length);
  const mood = mean(group.map((r) => r.mood));
  return [
    { value: `$${Math.round(rate).toLocaleString("en-US")}`, caption: "median day rate" },
    { value: `${Math.round(ai * 100)}%`, caption: "use AI weekly or daily" },
    { value: `${mood.toFixed(1)}/5`, caption: "mood about what’s next" },
  ];
}
