/**
 * Control schemas: describe a prototype's tunable parameters once and get the panel,
 * persistence, Reset and Randomize for free. Pure: no React, no DOM.
 *
 *   export const controls = defineControls({
 *     speed: { type: "number", label: "Speed", min: 0, max: 5, step: 0.1, default: 1 },
 *     trails: { type: "boolean", label: "Trails", default: true },
 *     shape: { type: "select", label: "Shape", options: ["circle", "square"], default: "circle" },
 *     tint: { type: "color", label: "Tint", default: "#7c5cff" },
 *     count: { type: "number", min: 1, max: 5000, step: 1, default: 800, randomize: false },
 *   });
 */

type Base = {
  /** Shown in the panel. Defaults to the key. */
  label?: string;
  /** Set false to keep this control fixed when Randomize is pressed. */
  randomize?: boolean;
};

export type NumberControl = Base & {
  type: "number";
  min: number;
  max: number;
  step?: number;
  default: number;
};
export type BooleanControl = Base & { type: "boolean"; default: boolean };
export type SelectControl = Base & {
  type: "select";
  options: readonly string[];
  default: string;
};
/** A user-chosen color value (data, not styling). Hex `#rrggbb`. */
export type ColorControl = Base & { type: "color"; default: string };

export type Control = NumberControl | BooleanControl | SelectControl | ColorControl;
export type ControlSchema = Record<string, Control>;

type ValueOf<C extends Control> = C extends NumberControl
  ? number
  : C extends BooleanControl
    ? boolean
    : C extends SelectControl
      ? C["options"][number]
      : string;

export type ControlValues<S extends ControlSchema> = { [K in keyof S]: ValueOf<S[K]> };

/** Identity function that keeps literal types (select options) for ControlValues. */
export function defineControls<const S extends ControlSchema>(schema: S): S {
  return schema;
}

export function defaultValues<S extends ControlSchema>(schema: S): ControlValues<S> {
  const out: Record<string, unknown> = {};
  for (const [k, c] of Object.entries(schema)) out[k] = c.default;
  return out as ControlValues<S>;
}

function snap(value: number, c: NumberControl): number {
  const step = c.step ?? (c.max - c.min) / 100;
  const snapped = c.min + Math.round((value - c.min) / step) * step;
  const clamped = Math.min(c.max, Math.max(c.min, snapped));
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Number(clamped.toFixed(decimals));
}

const HEX = /^#[0-9a-f]{6}$/i;

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** New random values. Controls with `randomize: false` keep their current value. */
export function randomValues<S extends ControlSchema>(
  schema: S,
  current: ControlValues<S>,
  rng: () => number = Math.random,
): ControlValues<S> {
  const out: Record<string, unknown> = { ...current };
  for (const [k, c] of Object.entries(schema)) {
    if (c.randomize === false) continue;
    switch (c.type) {
      case "number":
        out[k] = snap(c.min + rng() * (c.max - c.min), c);
        break;
      case "boolean":
        out[k] = rng() < 0.5;
        break;
      case "select":
        out[k] = c.options[Math.floor(rng() * c.options.length)] ?? c.default;
        break;
      case "color":
        out[k] = hslToHex(rng() * 360, 0.55 + rng() * 0.35, 0.45 + rng() * 0.2);
        break;
    }
  }
  return out as ControlValues<S>;
}

/** Coerce one value to what the control accepts, or fall back to its default. */
export function sanitizeValue(c: Control, v: unknown): unknown {
  switch (c.type) {
    case "number":
      return typeof v === "number" && Number.isFinite(v) ? snap(v, c) : c.default;
    case "boolean":
      return typeof v === "boolean" ? v : c.default;
    case "select":
      return typeof v === "string" && c.options.includes(v) ? v : c.default;
    case "color":
      return typeof v === "string" && HEX.test(v) ? v.toLowerCase() : c.default;
  }
}

/** Merge stored values over defaults, dropping unknown keys and invalid values. */
export function sanitizeValues<S extends ControlSchema>(schema: S, raw: unknown): ControlValues<S> {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const [k, c] of Object.entries(schema)) out[k] = k in src ? sanitizeValue(c, src[k]) : c.default;
  return out as ControlValues<S>;
}
