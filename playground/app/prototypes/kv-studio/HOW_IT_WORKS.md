# KV Studio

## What It Does

Animates the Motion, Now key visual in an editor laid out like the KV Editor, with a classic timeline docked along the bottom. You can stack brand behaviors on its layers and play them all from one **Progress** slider, or key any layer's channels. Then export the result as an MP4.

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
  - The settings (palette, length, frame rate, loop) live in `useControls` (persisted, with Reset and Randomize). The format is stored on its own as `playground:kv-studio:format`, because it's a top-bar control, as in the KV Editor.
  - The poster source and the animation persist in localStorage as `playground:kv-studio:poster` and `playground:kv-studio:anim`. Both go through `store.ts`, which uses `useSyncExternalStore` and keeps an undo history for the animation.
  - On the first visit there's no stored animation, so the studio uses `autoMix` of the poster.
- **Layer addressing**: tracks and behaviors point at a layer's `role` (`line1`, `blockA`, `lockup`…) when that role is unique, and otherwise at its id. That way an animation survives a format change or a re-import.
- **Playhead**: `clock.ts` lives outside React. The stage redraws from it on each tick. Only the transport and the key lanes subscribe, so playback never re-renders the panels.
- **Layout**
  - From `lg` up, the editor uses the KV Editor's grid:
    - the top bar: poster source, format buttons, undo/redo, MP4
    - layers on the left
    - the canvas and transport in the centre
    - the inspector on the right
    - the timeline across the bottom
  - Below `lg` it stacks: the top bar, the poster and the transport, then the **Timeline / Layer / Layers** tabs. `use-wide.ts` picks one tree, so nothing renders twice.
- **Selecting a layer**: tap it in the layer list, on the canvas (front-most layer under the finger), or by name in the timeline.
- **Timeline**
  - A time ruler that stays in view, with one row per layer: all its keys and thin bars for its behaviors.
  - Expand a row to get a lane per keyed channel and a bar per behavior. Drag the middle of a bar to move its window, or drag near an end to stretch it.
  - Drag keys to retime them (they snap to frames). **Key…** keys a channel at the playhead.
  - The selected key or behavior is edited below the rows.
  - Tapping or dragging any empty lane scrubs the playhead.
- **Inspector**
  - **Layer** shows the selected layer's behaviors (with **Auto mix** and **Clear** for the whole poster) and its keyframe lanes.
  - **Settings** is the playground control panel: palette, length, frame rate (12, 24, 30 or 60), loop, Reset and Randomize.
- **Frame rate**: the preview holds on whole frames, so 12 fps previews as stepped as it exports.
- **Auto mix** builds the KV choreography by layer type:
  1. blocks wipe in
  2. the bracket wipes down
  3. the grid draws on
  4. the headlines pixel-build behind a wipe
  5. the asterisk grows and spins
  6. the lockup wipes in
- **Shortcuts**: Space plays or pauses, ←/→ step one frame, ⌘Z/⇧⌘Z undo and redo the animation. They are ignored while typing.
- **Responsive**: the poster keeps its own aspect ratio inside the height left for it. Every control is a 44px target, and nothing scrolls sideways.
- **Reduced motion**: there's no autoplay. The playhead rests on the finished poster until you press play.
- **Theme**: the chrome uses the design tokens. The canvas uses the poster's palette, which is data, not theme.

## Key Dependencies

- `lib/kv/`: the Motion, Now poster core, ported from `kv-editor/`. It covers the model, the format presets, `render`, and the KV type treatment (opentype.js outlines with octilinear facets and ink).
- `opentype.js`: glyph outlines for the KV headline treatment.
- `mp4-muxer` with WebCodecs `VideoEncoder`: H.264 MP4 export, falling back to VP9-in-MP4.
- Fonts (OFL) in `public/shared/fonts/kv/`, shared with the Studio and its mini tools.

## Component Tree

```
KvStudio              controls + font gate
└─ Studio             useStudio (poster, format, anim), clock, shortcuts, selected layer; grid or stacked
   ├─ StudioToolbar   SourceMenu, format buttons, undo/redo, ExportButton
   ├─ LayersList
   ├─ PosterStage     canvas, render(animate(...)) on clock ticks, tap-to-select
   ├─ Transport       play/pause, Progress slider, time
   ├─ Inspector       Layer (MixPanel → BehaviorRow, KeyframesPanel → KeyLane, KeyEditor) | Settings (ControlPanel)
   └─ TimelinePanel   TimelineRuler, TimelineLayer → Lane, KeyDiamond, KeyLane, BehaviorBar
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
| `studio-toolbar.tsx`, `layers-list.tsx`, `inspector.tsx`, `use-wide.ts` | editor shell |
| `mix-panel.tsx`, `behavior-row.tsx` | behaviors in the inspector |
| `keyframes-panel.tsx`, `key-lane.tsx`, `key-editor.tsx` | keyframes in the inspector |
| `timeline-panel.tsx`, `timeline-layer.tsx`, `timeline-ruler.tsx`, `lane.tsx`, `behavior-bar.tsx` | the timeline |
