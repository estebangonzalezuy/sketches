import { defineControls } from "@/components/controls";
import { PALETTE_NAMES } from "@/lib/tmsc/palettes";
import { EXPERIENCE, MODES, REGIONS, ROLES, experienceOf, type Respondent } from "@/lib/tmsc/survey";

export const SLUG = "motion-now-map";

export const GROUPINGS = {
  Role: { key: (r: Respondent) => r.role, order: ROLES },
  Experience: { key: (r: Respondent) => experienceOf(r.years), order: EXPERIENCE },
  "Work mode": { key: (r: Respondent) => r.mode, order: MODES },
  Region: { key: (r: Respondent) => r.region, order: REGIONS },
} as const;
export type GroupingName = keyof typeof GROUPINGS;

export const controls = defineControls({
  group: { type: "select", label: "Group by", options: Object.keys(GROUPINGS) as GroupingName[], default: "Role" },
  dotSize: { type: "number", label: "Dot size", min: 3, max: 14, step: 0.5, default: 9 },
  drift: { type: "number", label: "Drift strength", min: 0, max: 1, step: 0.05, default: 0.4 },
  spacing: { type: "number", label: "Cluster spacing", min: 0.6, max: 1.3, step: 0.05, default: 1 },
  palette: { type: "select", label: "Palette", options: PALETTE_NAMES, default: "Acid on ink" },
  format: { type: "select", label: "Format", options: ["16:9 · 1920×1080", "4:5 · 1080×1350"], default: "16:9 · 1920×1080", randomize: false },
});

/** Seconds. */
export const MOVE_DUR = 0.9;
export const STAGGER = 0.001;
export const ZOOM_DUR = 1;
export const DIM = 0.25;
