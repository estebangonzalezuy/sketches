"use client";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { EASE_OPTIONS, TRACK_META } from "./data";
import { NumField } from "./num-field";
import { clamp01, sampleTrack } from "./ratio";
import { TChip } from "./t-chip";
import type { Ease, Track } from "./types";

const Arrow = () => <span aria-hidden>→</span>;

/** Keeps one stage of the chain on a single line, so wrapping happens between stages. */
const Group = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{children}</span>
);

/** Input stage of the chain: a window, or a rise/hold/fall envelope. */
function InputStage({ track, onChange }: { track: Track; onChange: (t: Track) => void }) {
  const i = track.input;
  const set = (patch: Partial<typeof i>) =>
    onChange({ ...track, input: { ...i, ...patch } as Track["input"] });
  if (i.kind === "window")
    return (
      <Group>
        remap(
        <NumField label={`${track.id} start`} step={0.05} value={i.from} onChange={(v) => set({ from: clamp01(v) })} />
        <Arrow />
        <NumField label={`${track.id} end`} step={0.05} value={i.to} onChange={(v) => set({ to: clamp01(v) })} />)
      </Group>
    );
  return (
    <>
      <Group>
        min( remap( 0 <Arrow />
        <NumField label={`${track.id} in end`} step={0.05} value={i.inEnd} onChange={(v) => set({ inEnd: clamp01(v) })} />
        ),
      </Group>
      <Group>
        1 − remap(
        <NumField label={`${track.id} out start`} step={0.05} value={i.outStart} onChange={(v) => set({ outStart: clamp01(v) })} />
        <Arrow /> 1 ) )
      </Group>
    </>
  );
}

/** One property: t → input → ease → output range, with the live result. */
export function TrackRow({ track, t, onChange }: { track: Track; t: number; onChange: (t: Track) => void }) {
  const meta = TRACK_META[track.id];
  const { progress, value } = sampleTrack(track, t);
  const setOut = (k: 0 | 1, v: number) => {
    const out: [number, number] = [...track.out];
    out[k] = v;
    onChange({ ...track, out });
  };
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card p-3">
      <span className="order-1 w-14 font-mono text-sm">{track.id}</span>
      <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
        <span className="w-16 text-right font-mono text-sm tabular-nums">
          {value.toFixed(meta.decimals)}
          {meta.unit}
        </span>
        <div className="h-1 w-16 overflow-hidden rounded-full bg-muted sm:w-20">
          <div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <div className="order-3 flex basis-full flex-wrap items-center gap-1.5 font-mono text-xs text-muted-foreground sm:order-2 sm:flex-1 sm:basis-0">
        <TChip t={t} />
        <Arrow />
        <InputStage track={track} onChange={onChange} />
        <Arrow />
        <NativeSelect
          size="sm"
          aria-label={`${track.id} easing`}
          value={track.ease}
          onChange={(e) => onChange({ ...track, ease: e.target.value as Ease })}
          className="font-mono text-foreground [&_select]:text-xs"
        >
          {EASE_OPTIONS.map((e) => (
            <NativeSelectOption key={e} value={e}>
              {e}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Arrow />
        <Group>
          remap(
          <NumField label={`${track.id} from`} step={meta.step} value={track.out[0]} onChange={(v) => setOut(0, v)} />
          <Arrow />
          <NumField label={`${track.id} to`} step={meta.step} value={track.out[1]} onChange={(v) => setOut(1, v)} />)
        </Group>
      </div>
    </div>
  );
}
