# Studio

## What It Does

A motion studio built from small, mixable tools: generators (Text, Rectangle, Shader Field, and the Motion, Now KV as layers) and effects (Corner Pin, Pixel (shape), Radial Warp, Wave). It's laid out like After Effects, with a viewer, an effect-controls inspector and a keyframe timeline, and it exports MP4. It opens on the Motion, Now poster, animated with every tool.

## Architecture

```
Project { layers[] (back → front), fps, duration }        model/ (pure, tested)
  Layer { tool, in/out, blend, transform tracks, params tracks, effects[] }
  Track = { value } | { keys[] }  — stopwatch off / on

renderFrame(ctx, project, t, scale)                        engine/compositor.ts
  for each active layer:
    layerContent(): generator → content in layer space    engine/pipeline.ts
       vector (contours) ──► vector effects (Corner Pin, Pixel shape, Radial Warp)
             │ first raster-only effect rasterises it
       raster (bitmap) ──► GL effects (Wave, Corner Pin on raster) via WebGL2   engine/gl.ts
    composite through position · anchor · scale · rotation, with blend and opacity
```

- **Two engines in one compositor.** Each tool says what it can do. A generator is `vector`, `raster` or `gl`. An effect has a `vector` and/or a `raster` implementation (WebGL2 fragment shaders through one shared context).
  - Vector content stays vector while it can, so shape effects stay sharp and can be chained. Pixel cells, for example, are then bent by a radial warp.
  - The first effect that only has a raster implementation rasterises the content, at the preview's resolution times the layer's scale.
- **The tool contract** (`tools/types.ts`) is what makes tools mixable, and what a future "describe an effect" feature would generate. It's the same idea as Motion Builder's `ToolDefinition`: declared params, a deterministic generate/apply, and optional on-canvas handles. A new tool is one file plus one line in `tools/registry.ts`.
- **Pixel (shape)** isn't a pixelation of the picture. Each grid cell whose centre is inside the outline (nonzero rule, by scanline spans) becomes a vector square, so animating the cell size redraws the shape.
- **Corner Pin** maps the shape's box to four pins (a projective homography). Pins are stored in box units, so they survive a text change. On raster layers the same pins warp the bitmap in GL.
- **Radial Warp** bends the box around a centre: x becomes the angle, y the radius (letters standing on a ring). `amount` blends from flat to fully warped.
- **The Motion, Now KV** (`model/kv-import.ts`) comes in as layers. Blocks, the bracket and the headlines are vector layers (headlines use the KV fonts, with optional KV facets). The paper, grid, asterisk and lockup are bitmaps drawn by the KV render (`lib/kv`).

## Frontend

- **Timeline (After Effects model)**
  - Layers front first, each with twirl-downs: Transform (Anchor, Position, Scale, Rotation, Opacity), Contents (generator params) and one group per effect.
  - **U** shows only the animated properties, all expanded. The timeline starts that way.
  - The stopwatch turns a property's animation on (it keys the value at the playhead) or off (it keeps the value at the playhead).
  - Click a key to select it. ⇧-click adds or removes. Drag on empty lanes to box-select.
  - Dragging a key moves every selected key together, snapped to frames, as one undo step.
  - Layer bars: drag the middle to slide the layer and its keys; drag an end to trim the in or out point.
  - The ruler scrubs (and pauses playback). The timecode reads `seconds:frames`.
- **Viewer**
  - Tap selects the front-most layer under the pointer. Dragging moves it: with Position's stopwatch on, it keys at the playhead, as in AE.
  - The selected layer shows its box, the motion path of its position (with a square per key), and its effects' handles (Corner Pin pins, the Radial Warp centre), which can be dragged and are keyed the same way.
  - The preview holds on whole frames, so 12 fps looks as stepped as it exports.
- **Inspector**
  - With a layer selected: name, restack, duplicate, delete and blend mode; the selected keys (ease for all of them, value when there's one); Transform; Contents; and the effect stack (add, enable, reorder, remove).
  - Every property has a stopwatch, and its label scrubs sideways (⇧ for ×10).
  - With no layer selected: the composition (name, length, 12/24/30/60 fps, background) and the View controls (preview quality, motion paths, effect handles) from the playground control panel.
- **Shortcuts**: Space, ←/→ (⇧ ×10 frames), Home/End, Delete (keys), F9 (Easy Ease on the selected keys), ⌘Z/⇧⌘Z.
- **Layout**
  - From lg up: toolbar, viewer and inspector side by side, and the timeline across the bottom.
  - Below lg: the viewer stacks over Timeline / Layer tabs. Rows and keys are 44px touch targets there, and the timeline's name column narrows.
- **State**
  - The project lives in `store.ts`, with a 150-step undo, saved to `playground:studio:project`.
  - Selection is React state in `Studio`.
  - The playhead is `clock.ts`, outside React. The canvas redraws from it, and only the time-dependent bits subscribe.
- **Reduced motion**: there's no autoplay. The playhead rests on the last frame.

## Key Dependencies

- `lib/kv` (the Motion, Now poster core): fonts, glyph outlines and KV facets, and the KV render for bitmap layers.
- `opentype.js` for outlines, WebGL2 for GL tools, WebCodecs and `mp4-muxer` for MP4.

## Component Tree

```
StudioApp            fonts gate, first-visit demo, view prefs (useControls)
└─ Studio            clock, selection, StudioContext, shortcuts, layout
   ├─ Toolbar        new KV comp per format, add layer, open/save JSON, undo/redo, ExportButton
   ├─ Viewport       canvas (renderFrame) + Overlay (box, MotionPath, handles, drag)
   ├─ Transport
   ├─ Inspector | CompPanel
   │    └─ KeysSection, ParamField × n, EffectsSection
   └─ Timeline       Ruler, RowName + RowLane (LayerBar, keys) per row, marquee, playhead
```

## Error Handling

- If a font fails, a message is shown instead of a poster in a fallback face. If WebGL2 is missing, the GL tools throw a readable error.
- Opening a bad project file shows a toast with the reason (wrong version, unknown tool).
- An effect that can't run on its input (none here yet) is skipped, not crashed.
- MP4 export reports a missing WebCodecs or codec, and pressing the button again cancels.

## File Structure

| Path | What |
| --- | --- |
| `model/` | types, eases, track evaluation, AE-style ops (stopwatch, set at playhead, move/delete/ease keys), specs, project defaults, KV import, demo |
| `engine/` | geometry (homography, subdivision), shape effects, pixel shape, rasteriser, WebGL2 runner, evaluation, pipeline, compositor, tests |
| `tools/` | the tool contract, registry, Text, shapes, KV layer and paper, shape effects, GL tools |
| `ui/` | studio shell, context, viewport and overlay, inspector, params, effects, keys, comp panel, toolbar, transport, shortcuts |
| `timeline/` | rows builder, timeline, ruler, row name, row lane, layer bar, key drag, marquee |
| `clock.ts`, `store.ts`, `export-mp4.ts`, `data.ts` | playhead, project store, MP4, view prefs |
