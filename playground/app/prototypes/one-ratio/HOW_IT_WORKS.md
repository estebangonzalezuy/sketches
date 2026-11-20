# One Ratio — How It Works

## What It Does

A single master value `t` (0–1) drives every property of a dot (x, y, scale, opacity).
Each property is an editable chain: remap a slice of `t`, ease it, map it to an output
range. Scrub `t` or press Play and watch every readout follow.

## Architecture

```
          Play (rAF) ─┐
                      ▼
  t slider ──────▶ usePlayer: t (the only animated state)
                      │
                      ▼
        tracks (useTracks ◀─▶ localStorage playground:one-ratio:tracks)
                      │
        sampleTrack(track, t)    ratio.ts (pure)
          input:  remap(t, from → to)                       window
                  min(remap(t, 0 → in), 1 − remap(t, out → 1))   envelope
          ease:   linear | easeIn | easeOut | easeInOut   (cubic)
          output: lerp(out[0], out[1], eased)
                      │
          ┌───────────┼──────────────┐
          ▼           ▼              ▼
        Stage      TrackRow ×4    path / onion skin
   (dot at t)   (formula + readout)  (sampled at many t)
```

## Frontend

- **State**: `t` and `playing` in `usePlayer`. Tracks in a small external store
  (`useSyncExternalStore`), persisted per prototype; the server render uses the defaults.
  Control panel values (duration, loop, path, onion skin) use `useControls`.
- **Playback**: the page opens at t = 0.39 so the dot is visible. Play advances `t` by `dt / duration` per frame. Pressing Play at the end
  restarts from 0. Scrubbing pauses and writes `t`. Because everything is a pure function
  of `t`, fast or repeated input never stacks animations.
- **Editing**: every number in a formula is an input. Input-window values clamp to 0–1;
  output ranges are free. **Reset curves** restores the reference values.
- **Debug layer**: dashed trajectory (the x/y tracks sampled 64 times) and an onion skin
  of the dot at t = 0.1…0.9.
- **Responsive**: single column. At 375px each row shows the name and readout on top and
  wraps the formula below; from `sm` the formula sits inline. Controls are the shared
  side panel (≥ lg) or bottom sheet.
- **Reduced motion**: Play jumps `t` between 0 and 1 instead of animating.
- **Shortcuts**: none.

## API

None.

## Key Dependencies

- `components/controls` (shared panel, persistence, Reset, Randomize).
- `components/ui`: Button, Slider, Input, NativeSelect. Icons from `lucide-react`.

## Component Tree

```
Page (page.tsx)
└── OneRatio
    └── ControlsLayout
        ├── Stage            dot, path, onion skin
        ├── Scrubber         Play/Pause, t chip, t slider
        ├── TrackRow ×4      TChip → InputStage → ease select → output range, readout
        └── Reset curves
```

## Error Handling

- Stored tracks are sanitized against the defaults (`sanitize.ts`): unknown ids dropped,
  bad numbers and eases replaced, input windows clamped.
- A number field ignores text that doesn't parse, and shows the stored value again on blur.

## File Structure

```
one-ratio/
├── page.tsx              thin server entry
├── metadata.json
├── HOW_IT_WORKS.md
├── types.ts              Track, TrackInput, Ease
├── data.ts               control schema, default tracks, per-track units
├── ratio.ts              remap, eases, sampleTrack, pathPoints (pure)
├── sanitize.ts           stored-track validation (pure)
├── ratio.test.ts         vitest, incl. the readouts from the reference talk
├── use-player.ts         t, Play loop, scrub
├── use-tracks.ts         persisted track store
├── use-reduced-motion.ts
├── one-ratio.tsx         client root
├── stage.tsx             preview + debug layer
├── scrubber.tsx          Play and t slider
├── track-row.tsx         one property chain
├── num-field.tsx         inline number input
└── t-chip.tsx            the t value chip
```
