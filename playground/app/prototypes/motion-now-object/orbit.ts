/** Curved text on a tilted ring around the object. Back half is drawn before the medal, front half after. */
import { font } from "@/lib/tmsc/fonts";
import { alpha } from "@/lib/tmsc/palettes";

type Ctx = CanvasRenderingContext2D;

export type Ring = { radius: number; tilt: number; phase: number; text: string; size: number; weight: number };

/**
 * A letter at angle φ sits at (r cos φ, r sin φ · sin tilt); z = r sin φ (positive = in front).
 * Reading runs toward decreasing φ, so the reading direction on screen is (sin φ, −cos φ · sin tilt):
 * letters foreshorten at the sides and mirror on the far side, like real type on a ring.
 */
export function drawRing(ctx: Ctx, cx: number, cy: number, ring: Ring, color: string, layer: "back" | "front") {
  ctx.font = font(ring.size, ring.weight);
  const chars = [...ring.text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const textW = widths.reduce((s, w) => s + w, 0) || 1;
  const circ = Math.PI * 2 * ring.radius;
  const reps = Math.max(1, Math.floor(circ / textW));
  const stretch = circ / (reps * textW);
  const st = Math.sin(ring.tilt);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let s = 0;
  for (let r = 0; r < reps; r++) {
    for (let k = 0; k < chars.length; k++) {
      const adv = widths[k] * stretch;
      const phi = ring.phase - (s + adv / 2) / ring.radius;
      s += adv;
      const sin = Math.sin(phi);
      const cos = Math.cos(phi);
      if ((sin >= 0) !== (layer === "front")) continue;
      const vx = sin;
      const vy = -cos * st;
      const len = Math.hypot(vx, vy);
      if (len < 0.08 || chars[k] === " ") continue;
      ctx.save();
      ctx.translate(cx + ring.radius * cos, cy + ring.radius * sin * st);
      ctx.rotate(Math.atan(vy / (vx || 1e-6)));
      ctx.scale(Math.sign(vx || 1) * len, 1);
      ctx.fillStyle = layer === "front" ? color : alpha(color, 0.45);
      ctx.fillText(chars[k], 0, 0);
      ctx.restore();
    }
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
