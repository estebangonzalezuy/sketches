# KV Studio

## What It Does

Animates the Motion, Now key visual. You can stack brand behaviors on its layers and play them all from one **Progress** slider, or key any layer's channels on a timeline. Then export the result as an MP4.

## Architecture

```
KV Editor JSON (Open JSON) ─┐
built-in Motion, Now preset ┴─► poster (lib/kv: model, presets, adaptTo per format)
                                     │  + Palette / Format controls
                                     ▼
 anim { tracks[], mix[] } ──► animate(poster, anim, t, duration)        pure
   tracks: keys per layer channel, read at t (seconds)
   mix:    behaviors, read at Progress p = t / duration
                                     │  Map<layerId, LayerFx {dx, dy, scale, rotate, alpha, clip, pixel}>
                                     ▼
                         lib/kv render(ctx, poster, { fx })   ← same call for preview and every MP4 frame
                                     │
                  canvas preview (clock ticks)     export-mp4 (WebCodecs + mp4-muxer)
```

Every channel is an offset from the resting poster. With no tracks and no mix, the render is exactly the static KV. Every behavior reaches rest at the end of its window, so the last frame of the mix is the poster itself.

## Frontend

- **State**
  - The global settings (format, palette, length, frame rate, loop) live in `useControls` (persisted, with Reset and Randomize).
  - The poster source and the animation persist in localStorage as `playground:kv-studio:poster` and `playground:kv-studio:anim`. Both go through `store.ts`, which uses `useSyncExternalStore` and keeps an undo history for the animation.
  - On the first visit there's no stored animation, so the studio uses `autoMix` of the poster.
- **Layer addressing**: tracks and behaviors point at a layer's `role` (`line1`, `blockA`, `lockup`…) when that role is unique, and otherwise at its id. That way an animation survives a format change or a re-import.
- **Playhead**: `clock.ts` lives outside React. The stage redraws from it on each tick. Only the transport and the key lanes subscribe, so playback never re-renders the panels.
- **Mix tab**
  - **Auto mix** builds the KV choreography by layer type:
    1. blocks wipe in
    2. the bracket wipes down
    3. the grid draws on
    4. the headlines pixel-build
    5. the asterisk grows and spins
    6. the lockup wipes in
  - Each layer can stack behaviors: fade, slide, wipe, grow, spin, pixel build, drift. Each has an amount and a *When* window inside Progress.
- **Keyframes tab**
  - Pick a layer and a channel (Move X/Y, Scale, Rotate, Opacity, Pixel cell, Reveal), then press **Key** to key it at the playhead.
  - Tap a key to select it and jump there. Drag it to retime it; it snaps to frames. Edit the value and the ease of the segment that leaves it.
- **Shortcuts**: Space plays or pauses, ←/→ step one frame, ⌘Z/⇧⌘Z undo and redo the animation. They are ignored while typing.
- **Responsive**
  - The poster sits at the top, at its own aspect ratio, capped at 60dvh so a 9:16 still leaves room for the transport.
  - On phones the settings live in the controls sheet. Every control is a 44px target, and nothing scrolls sideways.
- **Reduced motion**: there's no autoplay. The playhead rests on the finished poster until you press play.
- **Theme**: the chrome uses the design tokens. The canvas uses the poster's palette, which is data, not theme.

## Key Dependencies

- `lib/kv/`: the Motion, Now poster core, ported from `kv-editor/`. It covers the model, the format presets, `render`, and the KV type treatment (opentype.js outlines with octilinear facets and ink).
- `opentype.js`: glyph outlines for the KV headline treatment.
- `mp4-muxer` with WebCodecs `VideoEncoder`: H.264 MP4 export, falling back to VP9-in-MP4.
- Fonts (OFL) in `public/prototype-assets/kv-studio/fonts/`.

## Component Tree

```
KvStudio            ControlsLayout + font gate
└─ Studio           useStudio (poster + anim), clock, shortcuts
   ├─ PosterStage   canvas, render(animate(...)) on clock ticks
   ├─ Transport     play/pause, Progress slider, time
   ├─ SourceMenu    built-in / Open KV Editor JSON
   ├─ ExportButton  MP4 with progress and cancel
   └─ Tabs
      ├─ MixPanel → BehaviorRow (in Collapse)
      └─ KeyframesPanel → KeyLane, KeyEditor
```

## Error Handling

- If a font fails to load, the studio shows a message instead of a poster in a fallback face.
- A bad JSON shows a toast with the validator's reason (wrong version, unknown format, missing layers). Video and GIF layers in an imported JSON are dropped, because their files live in the KV Editor's IndexedDB.
- If WebCodecs or the codec is missing, the export shows a toast that names the browser problem. Pressing the export button again cancels.

## File Structure

| File | What |
| --- | --- |
| `page.tsx`, `metadata.json` | entry and gallery metadata |
| `kv-studio.tsx`, `studio.tsx` | root and layout |
| `types.ts`, `data.ts` | anim types, the control schema, behavior and channel catalogs |
| `animate.ts` | pure: poster + anim + t → per-layer fx |
| `tracks.ts`, `easing.ts` | keyframe evaluation and editing, cubic-bezier eases |
| `behaviors.ts`, `channels.ts` | behavior math, channel sums → fx |
| `auto-mix.ts` | the KV choreography |
| `animate.test.ts` | rest at the end, determinism, no mutation, tracks + mix composition |
| `store.ts`, `use-studio.ts` | persisted state with undo, font loading, the poster per format and palette |
| `clock.ts`, `use-clock.ts`, `use-shortcuts.ts`, `use-reduced-motion.ts` | playhead and input |
| `poster-stage.tsx`, `transport.tsx`, `export-button.tsx`, `export-mp4.ts`, `source-menu.tsx` | stage, playback, export, source |
| `mix-panel.tsx`, `behavior-row.tsx` | Mix tab |
| `keyframes-panel.tsx`, `key-lane.tsx`, `key-editor.tsx` | Keyframes tab |
