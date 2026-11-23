/** Finding parsing and number formatting. Pure. */
import { CHAPTER_NAMES, type ChapterName } from "@/lib/tmsc/palettes";
import { CHART_TYPES, type ChartType, type Finding } from "./types";

/** "12, 40 ,x, 7" → [12, 40, 7] */
export function parseList(text: string): number[] {
  return text
    .split(/[,;\s]+/)
    .map((s) => Number(s))
    .filter((v) => Number.isFinite(v))
    .slice(0, 40);
}

function toFinding(raw: unknown, where: string): Finding | string {
  if (!raw || typeof raw !== "object") return `${where} is not an object.`;
  const r = raw as Record<string, unknown>;
  const number = typeof r.number === "number" ? String(r.number) : r.number;
  if (typeof number !== "string" || !number.trim()) return `${where}: "number" is required.`;
  if (typeof r.sentence !== "string") return `${where}: "sentence" must be text.`;
  const chart = (r.chart ?? "bar") as ChartType;
  if (!CHART_TYPES.includes(chart)) return `${where}: "chart" must be one of ${CHART_TYPES.join(", ")}.`;
  const chapter = (r.chapter ?? "Money") as ChapterName;
  if (!CHAPTER_NAMES.includes(chapter)) return `${where}: "chapter" must be one of ${CHAPTER_NAMES.join(", ")}.`;
  const data = Array.isArray(r.data) ? r.data.filter((v): v is number => typeof v === "number" && Number.isFinite(v)) : typeof r.data === "string" ? parseList(r.data) : [];
  return {
    number: number.slice(0, 12),
    unit: typeof r.unit === "string" ? r.unit.slice(0, 12) : "",
    sentence: r.sentence.slice(0, 220),
    chart,
    data: data.slice(0, 40),
    chapter,
    n: typeof r.n === "number" && r.n > 0 ? Math.round(r.n) : 300,
  };
}

export function parseFindings(text: string): { ok: true; value: Finding[] } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }
  const list = Array.isArray(raw) ? raw : [raw];
  if (!list.length) return { ok: false, error: "The array is empty." };
  if (list.length > 60) return { ok: false, error: "Up to 60 findings at once." };
  const out: Finding[] = [];
  for (let i = 0; i < list.length; i++) {
    const f = toFinding(list[i], `Finding ${i + 1}`);
    if (typeof f === "string") return { ok: false, error: f };
    out.push(f);
  }
  return { ok: true, value: out };
}

export const sanitizeFinding = (raw: unknown) => {
  const f = toFinding(raw, "");
  return typeof f === "string" ? undefined : f;
};
export const sanitizeFindings = (raw: unknown) => {
  const r = parseFindings(JSON.stringify(raw ?? null));
  return r.ok ? r.value : undefined;
};

const PREFIX_UNITS = new Set(["$", "€", "£", "US$", "R$", "¥"]);

/** The number as shown at progress p (0..1 of the count-up), with the unit placed right. */
export function displayNumber(f: Pick<Finding, "number" | "unit">, p: number): string {
  const m = f.number.match(/^([^\d-]*)(-?[\d.,]+)(.*)$/);
  const unit = f.unit.trim();
  const wrap = (s: string) => (PREFIX_UNITS.has(unit) ? `${unit}${s}` : unit ? `${s}${/^[%×x+]/.test(unit) ? "" : " "}${unit}` : s);
  if (!m) return wrap(f.number);
  const [, pre, digits, post] = m;
  const target = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(target)) return wrap(f.number);
  const decimals = (digits.split(".")[1] ?? "").length;
  const v = target * Math.min(1, Math.max(0, p));
  const s = v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return wrap(`${pre}${s}${post}`);
}

/** Share (0..100) a donut or dot grid shows: the number if it looks like a percent, else data[0]. */
export function shareOf(f: Finding): number {
  const n = Number(f.number.replace(/[^\d.-]/g, ""));
  const v = f.unit.trim() === "%" && Number.isFinite(n) ? n : (f.data[0] ?? n);
  return Math.min(100, Math.max(0, Number.isFinite(v) ? v : 0));
}
