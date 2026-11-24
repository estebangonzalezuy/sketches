import { CARD_H, CARD_W } from "./data";
import { project } from "./rig";
import type { CardPose, View } from "./types";

/** One card, a billboard placed by projecting its world position. */
export function OrbitCard({
  pose,
  index,
  view,
  tint,
  rank,
  hidden,
}: {
  pose: CardPose;
  index: number;
  view: View;
  tint: string;
  rank: number;
  hidden: boolean;
}) {
  const s = project(pose.pos, view);
  return (
    <div
      aria-hidden
      className="absolute top-0 left-0 overflow-hidden rounded-lg border border-border bg-background shadow-sm"
      style={{
        width: CARD_W,
        height: CARD_H,
        zIndex: rank,
        opacity: hidden ? 0 : 1,
        transform: `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) scale(${pose.scale * s.f})`,
      }}
    >
      {/* Tint is a user-picked color (data); each card shifts its hue so they read apart. */}
      <div
        className="m-2 h-[58%] rounded-md"
        style={{
          background: `color-mix(in oklch, ${tint} ${80 - (index % 4) * 12}%, var(--card))`,
          filter: `hue-rotate(${index * 37}deg)`,
        }}
      />
      <div className="mx-2 mt-3 h-1.5 w-2/3 rounded-full bg-muted" />
      <div className="mx-2 mt-1.5 h-1.5 w-1/2 rounded-full bg-muted" />
      <span className="absolute right-2 bottom-1.5 font-mono text-[10px] text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}
