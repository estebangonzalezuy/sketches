import { orbCenter, project, sphereRings } from "./rig";
import type { CardPose, RigParams, Vec3, View } from "./types";

const toPath = (pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("");

/**
 * The invisible structure, drawn over the scene: the orb as a dotted wireframe, its
 * vertical axis, each card's anchor ring, and (optionally) each card's flight path.
 */
export function DebugOverlay({
  params,
  squash,
  spinDeg,
  poses,
  view,
  sphere,
  paths,
}: {
  params: RigParams;
  squash: Vec3;
  spinDeg: number;
  poses: CardPose[];
  view: View;
  sphere: boolean;
  paths: boolean;
}) {
  const c = orbCenter(params);
  const reach = params.orbSize * squash.y * 1.25;
  const axisA = project({ ...c, y: c.y - reach }, view);
  const axisB = project({ ...c, y: c.y + reach }, view);
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 z-[100] size-full">
      {sphere && (
        <g className="fill-none stroke-foreground/30" strokeWidth={1} strokeDasharray="1.5 3">
          {sphereRings(params, squash, spinDeg).map((ring, i) => (
            <path key={i} d={toPath(ring.map((p) => project(p, view)))} />
          ))}
        </g>
      )}
      {sphere && (
        <line x1={axisA.x} y1={axisA.y} x2={axisB.x} y2={axisB.y} className="stroke-foreground/60" strokeWidth={1} />
      )}
      {paths && (
        <g className="stroke-muted-foreground" strokeWidth={1} strokeDasharray="4 4">
          {poses.map((p, i) => {
            const a = project(p.start, view);
            const b = project(p.anchor, view);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </g>
      )}
      {(sphere || paths) &&
        poses.map((p, i) => {
          const a = project(p.anchor, view);
          return <circle key={i} cx={a.x} cy={a.y} r={5} className="fill-background stroke-foreground" strokeWidth={1.5} />;
        })}
    </svg>
  );
}
