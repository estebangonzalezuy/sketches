"use client";

import { GHOST_STEPS } from "./data";
import { pathPoints, sampleAll } from "./ratio";
import type { Track } from "./types";

function Dot({ v, faint }: { v: ReturnType<typeof sampleAll>; faint?: boolean }) {
  return (
    <div
      aria-hidden
      className="absolute size-12 rounded-full bg-foreground sm:size-14"
      style={{
        left: `${v.x}%`,
        top: `${v.y}%`,
        transform: `translate(-50%, -50%) scale(${v.scale})`,
        opacity: faint ? v.opacity * 0.12 : v.opacity,
      }}
    />
  );
}

/** The preview: the dot at t, plus the debug layer (trajectory and onion skin). */
export function Stage({
  tracks,
  t,
  showPath,
  ghosts,
}: {
  tracks: Track[];
  t: number;
  showPath: boolean;
  ghosts: boolean;
}) {
  const points = pathPoints(tracks).map(([x, y]) => `${x},${y}`).join(" ");
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-card">
      {showPath && (
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full text-muted-foreground/40"
        >
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {ghosts && GHOST_STEPS.map((g) => <Dot key={g} v={sampleAll(tracks, g)} faint />)}
      <Dot v={sampleAll(tracks, t)} />
    </div>
  );
}
