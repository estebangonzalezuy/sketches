import { quadsAt, restStack, steepCurve, wordsFor } from "./motion";
import type { PinRenderer } from "./renderer";
import type { Settings } from "./types";
import { wordTexture } from "./word-textures";

/** One frame at time t (seconds): the same call for the preview and every exported frame. */
export function drawFrame(r: PinRenderer, s: Settings, text: string, t: number) {
  const words = wordsFor(text, Math.round(s.words)).map(wordTexture);
  const stack = restStack({ w: r.canvas.width, h: r.canvas.height }, words.map((w) => w.aspect), s.margin);
  const quads = quadsAt(stack, t, { amplitude: s.amplitude, loop: s.loop, curve: steepCurve(s.steepness), phase: s.phase });
  r.render(words, quads, s.ink, s.ground);
}
