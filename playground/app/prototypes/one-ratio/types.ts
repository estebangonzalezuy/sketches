export type Ease = "linear" | "easeIn" | "easeOut" | "easeInOut";

export type TrackId = "x" | "y" | "scale" | "opacity";

/**
 * How a track reads the master ratio t:
 *   window    remap(t, from → to)                          start late, finish early
 *   envelope  min(remap(t, 0 → inEnd), 1 − remap(t, outStart → 1))   rise, hold, fall
 */
export type TrackInput =
  | { kind: "window"; from: number; to: number }
  | { kind: "envelope"; inEnd: number; outStart: number };

export type Track = {
  id: TrackId;
  input: TrackInput;
  ease: Ease;
  /** Output range: the eased 0–1 progress maps linearly from out[0] to out[1]. */
  out: [number, number];
};

export type Sample = { progress: number; value: number };
