/** Turns the user's answers into the object's texts and joke stats. Pure. */
import { ROLES } from "@/lib/tmsc/survey";
import { DEFAULT_ANSWERS, EASINGS, type Answers, type EasingName } from "./data";

export function sanitizeAnswers(raw: unknown): Answers | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  return {
    handle: typeof r.handle === "string" ? r.handle.slice(0, 24) : DEFAULT_ANSWERS.handle,
    role: ROLES.includes(r.role as Answers["role"]) ? (r.role as Answers["role"]) : DEFAULT_ANSWERS.role,
    years: typeof r.years === "string" ? r.years.slice(0, 3) : DEFAULT_ANSWERS.years,
    easing: typeof r.easing === "string" && r.easing in EASINGS ? (r.easing as EasingName) : DEFAULT_ANSWERS.easing,
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

export const yearsOf = (a: Answers) => Math.max(0, Math.min(60, Math.round(Number(a.years) || 0)));

export function bezierText(e: EasingName): string {
  const [a, b, c, d] = EASINGS[e];
  const f = (v: number) => String(v).replace(/^0\./, ".").replace(/^-0\./, "-.");
  return `cubic-bezier(${f(a)},${f(b)},${f(c)},${f(d)})`;
}

/** The technical joke labels around the object. Deterministic per answer set. */
export function jokeLabels(a: Answers): string[] {
  const y = yearsOf(a);
  const h = hash(`${a.handle}|${a.role}|${y}`);
  const keyframes = Math.round((y * 1550 + (h % 900)) / 100) * 100;
  const hours = 18 + (h % 40);
  return [
    `keyframes: ${keyframes.toLocaleString("en-US")}`,
    `easing: ${bezierText(a.easing)}`,
    `render time: ${hours}h ${h % 60}m`,
    `frame rate: 24 fps, emotionally 12`,
    `feedback rounds: ${y > 10 ? "∞" : 3 + (h % 9)}`,
    `graph editor: always open`,
  ];
}

/** Point on a CSS cubic-bezier at parameter s (not at x). */
export function bezierPoint(e: EasingName, s: number): [number, number] {
  const [x1, y1, x2, y2] = EASINGS[e];
  const u = 1 - s;
  return [3 * u * u * s * x1 + 3 * u * s * s * x2 + s ** 3, 3 * u * u * s * y1 + 3 * u * s * s * y2 + s ** 3];
}
