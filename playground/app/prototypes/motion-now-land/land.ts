/** Where a user lands in the (example) survey: filtering, distribution, percentile, sentence. Pure. */
import { median, percentileRank, quantile, sorted } from "@/lib/tmsc/stats";
import { experienceOf, type Respondent } from "@/lib/tmsc/survey";
import { ALL, CURRENCIES, MIN_GROUP, type Currency, type Metric } from "./data";

export type Filters = { role: string; years: string; mode: string };

export type Landing =
  | { enough: false; n: number }
  | {
      enough: true;
      n: number;
      bins: number[];
      /** Value at the left edge of each bin; the last bin is closed at `max`. */
      edges: number[];
      max: number;
      median: number;
      q25: number;
      q75: number;
      /** 0..100, or null when the user hasn't entered a value. */
      percentile: number | null;
      you: number | null;
    };

/** The years filter is ignored when the metric is years itself. */
export function filterGroup(people: readonly Respondent[], f: Filters, metric: Metric): Respondent[] {
  return people.filter(
    (p) =>
      (f.role === ALL || p.role === f.role) &&
      (f.mode === ALL || p.mode === f.mode) &&
      (metric === "Years of experience" || f.years === ALL || experienceOf(p.years) === f.years),
  );
}

function niceStep(span: number, target: number): number {
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
}

export function land(people: readonly Respondent[], f: Filters, metric: Metric, currency: Currency, you: number | null): Landing {
  const group = filterGroup(people, f, metric);
  if (group.length < MIN_GROUP) return { enough: false, n: group.length };
  const fx = CURRENCIES[currency];
  const values = group.map((p) => (metric === "Day rate" ? p.dayRate * fx : p.years));
  const asc = sorted(values);
  const top = Math.max(quantile(asc, 0.97) * 1.15, you ?? 0);
  const step = metric === "Day rate" ? niceStep(top, 14) : 2;
  const count = Math.max(4, Math.ceil(top / step));
  const bins = new Array<number>(count).fill(0);
  for (const v of values) bins[Math.min(count - 1, Math.floor(v / step))]++;
  return {
    enough: true,
    n: group.length,
    bins,
    edges: bins.map((_, i) => i * step),
    max: count * step,
    median: median(asc),
    q25: quantile(asc, 0.25),
    q75: quantile(asc, 0.75),
    percentile: you === null ? null : Math.round(percentileRank(values, you)),
    you,
  };
}

const PLURAL: Record<string, string> = {
  "Motion designer": "motion designers",
  "3D artist": "3D artists",
  "2D animator": "2D animators",
  "Art director": "art directors",
  "Creative coder": "creative coders",
};

/** "freelance 3D artists with 6–10 yrs of experience" */
export function who(f: Filters, metric: Metric): string {
  const mode = f.mode === ALL ? "" : `${f.mode.toLowerCase()} `;
  const role = f.role === ALL ? "motion designers" : PLURAL[f.role] ?? f.role;
  const years = metric === "Day rate" && f.years !== ALL ? ` with ${f.years} of experience` : "";
  return `${mode}${role}${years}`;
}

export function sentence(l: Landing, f: Filters, metric: Metric): string {
  if (!l.enough || l.percentile === null) return "";
  const pct = Math.min(99, Math.max(1, l.percentile));
  const verb = metric === "Day rate" ? "You charge more than" : "You have more experience than";
  return `${verb} ${pct}% of ${who(f, metric)}.`;
}

export function money(v: number, currency: Currency): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

export function formatValue(v: number, metric: Metric, currency: Currency): string {
  return metric === "Day rate" ? money(v, currency) : `${Math.round(v)} yrs`;
}
