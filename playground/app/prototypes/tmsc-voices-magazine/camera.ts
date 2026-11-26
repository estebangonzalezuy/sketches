import { easeFn } from "./easing";

/**
 * The camera, as three numbers: tilt (degrees from straight down), yaw (degrees around the
 * magazine) and zoom (1 = the whole spread fits). The panel sets a base view; Record adds an
 * opening move that eases into it and an optional drift for the rest of the video. A pure
 * function of time, so every export repeats exactly.
 */

export type View = { tilt: number; yaw: number; zoom: number };

export const INTROS = ["None", "Zoom in", "Zoom out", "Swing", "Rise", "Top-down"] as const;
export const DRIFTS = ["None", "Slow push", "Orbit", "Float"] as const;
export type Intro = (typeof INTROS)[number];
export type Drift = (typeof DRIFTS)[number];

export type CameraSetup = View & { intro: Intro; introDur: number; drift: Drift; driftAmount: number };

export const DEFAULT_VIEW: View = { tilt: 17, yaw: 0, zoom: 1 };
export const DEFAULT_CAMERA: CameraSetup = { ...DEFAULT_VIEW, intro: "Zoom in", introDur: 2.4, drift: "None", driftAmount: 0.5 };

/** Where each opening move starts, relative to the base view. */
function introStart(intro: Intro, v: View): View {
  switch (intro) {
    case "Zoom in":
      return { ...v, zoom: v.zoom * 0.55 };
    case "Zoom out":
      return { ...v, zoom: v.zoom * 1.9 };
    case "Swing":
      return { ...v, yaw: v.yaw - 38, zoom: v.zoom * 0.85 };
    case "Rise":
      return { ...v, tilt: Math.min(70, v.tilt + 40), zoom: v.zoom * 0.9 };
    case "Top-down":
      return { ...v, tilt: 0, zoom: v.zoom * 0.8 };
    default:
      return v;
  }
}

const mix = (a: number, b: number, k: number) => a + (b - a) * k;

/** The view at time t of a sequence lasting `duration` seconds. */
export function viewAt(c: CameraSetup, t: number, duration: number): View {
  const base: View = { tilt: c.tilt, yaw: c.yaw, zoom: c.zoom };
  let v = base;
  if (c.intro !== "None" && t < c.introDur) {
    const k = easeFn("Ease in-out")(Math.max(0, t) / c.introDur);
    const s = introStart(c.intro, base);
    v = { tilt: mix(s.tilt, base.tilt, k), yaw: mix(s.yaw, base.yaw, k), zoom: mix(s.zoom, base.zoom, k) };
  }
  // the drift starts as the opening move ends, from zero, so the two join without a jump
  const from = c.intro === "None" ? 0 : c.introDur;
  const u = duration > from ? Math.min(1, Math.max(0, (t - from) / (duration - from))) : 0;
  const a = c.driftAmount;
  switch (c.drift) {
    case "Slow push":
      return { ...v, zoom: v.zoom * (1 + 0.25 * a * easeFn("Ease in-out")(u)) };
    case "Orbit":
      return { ...v, yaw: v.yaw + 16 * a * Math.sin(Math.PI * u) };
    case "Float": {
      const s = t - from;
      return t < from ? v : { ...v, tilt: v.tilt + 4 * a * Math.sin(s * 0.7), yaw: v.yaw + 5 * a * Math.sin(s * 0.45) };
    }
    default:
      return v;
  }
}

export function cameraFrom(v: Record<string, unknown>): CameraSetup {
  const n = (x: unknown, d: number, lo: number, hi: number) => (Number.isFinite(Number(x)) ? Math.min(hi, Math.max(lo, Number(x))) : d);
  const d = DEFAULT_CAMERA;
  return {
    tilt: n(v.cameraTilt, d.tilt, 0, 70),
    yaw: n(v.cameraYaw, d.yaw, -60, 60),
    zoom: n(v.cameraZoom, d.zoom * 100, 50, 250) / 100,
    intro: INTROS.includes(v.cameraIntro as Intro) ? (v.cameraIntro as Intro) : d.intro,
    introDur: n(v.cameraIntroDuration, d.introDur, 0.3, 10),
    drift: DRIFTS.includes(v.cameraDrift as Drift) ? (v.cameraDrift as Drift) : d.drift,
    driftAmount: n(v.cameraDriftAmount, d.driftAmount * 100, 0, 200) / 100,
  };
}
