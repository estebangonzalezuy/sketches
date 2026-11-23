"use client";

import { STAGE_WORLD_WIDTH } from "./data";
import { DebugOverlay } from "./debug-overlay";
import { OrbitCard } from "./orbit-card";
import { cardPoses } from "./rig";
import type { RigParams, Vec3 } from "./types";
import { useSize } from "./use-size";

/** The production scene plus its debug layer. Tap or Enter toggles rest ↔ orbit. */
export function Stage({
  params,
  squash,
  t,
  spinDeg,
  tint,
  sphere,
  paths,
  hideFront,
  onToggle,
}: {
  params: RigParams;
  squash: Vec3;
  t: number;
  spinDeg: number;
  tint: string;
  sphere: boolean;
  paths: boolean;
  hideFront: boolean;
  onToggle: () => void;
}) {
  const [ref, size] = useSize<HTMLDivElement>();
  const view = { cx: size.width / 2, cy: size.height / 2, k: size.width / STAGE_WORLD_WIDTH };
  const poses = cardPoses(params, squash, t, spinDeg);
  // Painter's order: farthest first. The last one is the front card.
  const order = poses.map((pose, index) => ({ pose, index })).sort((a, b) => a.pose.pos.z - b.pose.pos.z);
  const front = order.at(-1)?.index;

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label="Toggle rest and orbit"
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onToggle();
      }}
      className="relative aspect-[4/3] w-full cursor-pointer touch-manipulation overflow-hidden rounded-xl border border-border bg-card outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {size.width > 0 && (
        <>
          {order.map(({ pose, index }, rank) => (
            <OrbitCard
              key={index}
              pose={pose}
              index={index}
              view={view}
              tint={tint}
              rank={rank + 1}
              hidden={hideFront && index === front}
            />
          ))}
          <DebugOverlay
            params={params}
            squash={squash}
            spinDeg={spinDeg}
            poses={poses}
            view={view}
            sphere={sphere}
            paths={paths}
          />
        </>
      )}
    </div>
  );
}
