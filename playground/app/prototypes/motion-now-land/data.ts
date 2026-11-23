import { defineControls } from "@/components/controls";
import { PALETTE_NAMES } from "@/lib/tmsc/palettes";
import { EXPERIENCE, MODES, ROLES } from "@/lib/tmsc/survey";

export const SLUG = "motion-now-land";

/** EXAMPLE exchange rates (per 1 USD), only for comparing against the fake survey. */
export const CURRENCIES = { USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.38, AUD: 1.52, BRL: 5.4, MXN: 18.5, UYU: 40, JPY: 152 } as const;
export type Currency = keyof typeof CURRENCIES;

export const ALL = "All";
export const MIN_GROUP = 20;

export const controls = defineControls({
  metric: { type: "select", label: "Metric", options: ["Day rate", "Years of experience"], default: "Day rate" },
  role: { type: "select", label: "Role", options: [ALL, ...ROLES], default: ALL },
  years: { type: "select", label: "Years", options: [ALL, ...EXPERIENCE], default: ALL },
  mode: { type: "select", label: "Work mode", options: [ALL, ...MODES], default: ALL },
  currency: { type: "select", label: "Currency", options: Object.keys(CURRENCIES) as Currency[], default: "USD", randomize: false },
  palette: { type: "select", label: "Palette", options: PALETTE_NAMES, default: "Ink on acid" },
  format: { type: "select", label: "Format", options: ["Share · 1200×630", "4:5 · 1080×1350", "16:9 · 1920×1080"], default: "Share · 1200×630", randomize: false },
});

export type Metric = (typeof controls.metric.options)[number];

export const DEFAULT_INPUT = { rate: "450", years: "7" };

/** Seconds. */
export const DROP_DUR = 0.9;
