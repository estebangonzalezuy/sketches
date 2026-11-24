/**
 * EXAMPLE DATA: a fake survey of ~300 motion designers worldwide. Nothing here is real.
 * Generated from a fixed seed so every tool and every load shows the same respondents.
 */
import { gaussian, mulberry32, pick } from "./random";

export const ROLES = ["Motion designer", "3D artist", "2D animator", "Art director", "Creative coder"] as const;
export const MODES = ["Freelance", "Studio", "In-house"] as const;
export const REGIONS = ["Latin America", "North America", "Europe", "Asia Pacific", "Africa & Middle East"] as const;
export const AI_USE = ["Never", "Rarely", "Monthly", "Weekly", "Daily"] as const;
export const EXPERIENCE = ["0–2 yrs", "3–5 yrs", "6–10 yrs", "11–15 yrs", "16+ yrs"] as const;

export type Role = (typeof ROLES)[number];
export type Mode = (typeof MODES)[number];
export type Region = (typeof REGIONS)[number];
export type AiUse = (typeof AI_USE)[number];
export type Experience = (typeof EXPERIENCE)[number];

export type Respondent = {
  id: number;
  role: Role;
  years: number;
  mode: Mode;
  region: Region;
  /** Typical day rate, USD. */
  dayRate: number;
  /** "How do you feel about what's coming?" 1 (worried) … 5 (excited). */
  mood: number;
  ai: AiUse;
};

export function experienceOf(years: number): Experience {
  if (years <= 2) return "0–2 yrs";
  if (years <= 5) return "3–5 yrs";
  if (years <= 10) return "6–10 yrs";
  if (years <= 15) return "11–15 yrs";
  return "16+ yrs";
}

const REGION_RATE: Record<Region, number> = {
  "Latin America": 210,
  "North America": 560,
  Europe: 430,
  "Asia Pacific": 330,
  "Africa & Middle East": 240,
};
const ROLE_RATE: Record<Role, number> = {
  "Motion designer": 1,
  "3D artist": 1.08,
  "2D animator": 0.92,
  "Art director": 1.35,
  "Creative coder": 1.18,
};

export function generateRespondents(count = 300, seed = 2026): Respondent[] {
  const rng = mulberry32(seed);
  const out: Respondent[] = [];
  for (let id = 1; id <= count; id++) {
    const role = pick(rng, [["Motion designer", 40], ["3D artist", 18], ["2D animator", 16], ["Art director", 13], ["Creative coder", 13]] as const);
    const mode = pick(rng, [["Freelance", 46], ["Studio", 30], ["In-house", 24]] as const);
    const region = pick(rng, [["Latin America", 24], ["North America", 22], ["Europe", 30], ["Asia Pacific", 16], ["Africa & Middle East", 8]] as const);
    const minYears = role === "Art director" ? 5 : 0;
    const years = Math.min(30, minYears + Math.round(Math.abs(gaussian(rng)) * 7 + rng() * 2));
    const growth = 0.55 + Math.min(years, 20) * 0.045;
    const freelance = mode === "Freelance" ? 1.12 : 1;
    const raw = REGION_RATE[region] * ROLE_RATE[role] * growth * freelance * Math.exp(gaussian(rng) * 0.28);
    const dayRate = Math.max(60, Math.round(raw / 5) * 5);
    const aiBias = role === "Creative coder" ? 1.2 : role === "2D animator" ? -0.6 : 0;
    const aiIndex = Math.round(Math.min(4, Math.max(0, 2 + aiBias + gaussian(rng) * 1.15)));
    const mood = Math.round(Math.min(5, Math.max(1, 3.1 + (aiIndex - 2) * 0.25 + gaussian(rng) * 1.0)));
    out.push({ id, role, years, mode, region, dayRate, mood, ai: AI_USE[aiIndex] });
  }
  return out;
}

export const EXAMPLE_RESPONDENTS = generateRespondents();

/** Validate pasted JSON. Returns respondents or a readable error. */
export function parseRespondents(text: string): { ok: true; value: Respondent[] } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }
  if (!Array.isArray(raw)) return { ok: false, error: "Expected an array of respondents." };
  if (raw.length === 0) return { ok: false, error: "The array is empty." };
  if (raw.length > 5000) return { ok: false, error: "Up to 5,000 respondents." };
  const out: Respondent[] = [];
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i] as Record<string, unknown>;
    const where = `Item ${i + 1}`;
    if (!r || typeof r !== "object") return { ok: false, error: `${where} is not an object.` };
    if (!ROLES.includes(r.role as Role)) return { ok: false, error: `${where}: role must be one of ${ROLES.join(", ")}.` };
    if (!MODES.includes(r.mode as Mode)) return { ok: false, error: `${where}: mode must be one of ${MODES.join(", ")}.` };
    if (!REGIONS.includes(r.region as Region)) return { ok: false, error: `${where}: region must be one of ${REGIONS.join(", ")}.` };
    if (!AI_USE.includes(r.ai as AiUse)) return { ok: false, error: `${where}: ai must be one of ${AI_USE.join(", ")}.` };
    for (const k of ["years", "dayRate", "mood"] as const) {
      if (typeof r[k] !== "number" || !Number.isFinite(r[k])) return { ok: false, error: `${where}: ${k} must be a number.` };
    }
    out.push({
      id: typeof r.id === "number" ? r.id : i + 1,
      role: r.role as Role,
      mode: r.mode as Mode,
      region: r.region as Region,
      ai: r.ai as AiUse,
      years: Math.max(0, Math.round(r.years as number)),
      dayRate: Math.max(0, r.dayRate as number),
      mood: Math.min(5, Math.max(1, Math.round(r.mood as number))),
    });
  }
  return { ok: true, value: out };
}
