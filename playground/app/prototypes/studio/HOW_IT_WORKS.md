# Studio

## What It Does

A motion studio built from small, mixable tools. It's laid out like After Effects (viewer, effect-controls inspector, keyframe timeline with a graph editor) and exports MP4.

- **Studio tools**: Text, Rectangle, Shader Field, and the Motion, Now KV as layers; effects Corner Pin, Pixel (shape), Radial Warp, Letters (per-letter stretch and skew) and Wave.
- **Every Motion Builder tool**: Tag Shader, Text Extruder, Text, Chart, Table, Counter, Pixelado, ASCII, Spray and its 7 modes.
- **Projects** open in tabs, each in an environment (Motion, Now · Inception · Spray · Free) that decides its tools and animation templates. The first tab is the Motion, Now poster, animated with every studio tool.

## Mini tools

Every studio effect is also its own prototype: Corner Pin, Pixel (shape), Radial Warp, Kinetic Letters and Wave. Each is the same editor locked to one effect, with its templates and a demo. They're there to share one effect, or to animate just that.
- **Open in Studio** opens the mini tool's project as a new tab here, in the Free environment.
- All of the engine lives in `lib/studio/`; this prototype only mounts `<StudioEditor slug="studio" tabs />`.

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
- **Motion Builder inside the studio.** `lib/motion-builder/` is the Motion Builder tool set, ported unchanged (core contract and tools). `engine/mb-host.ts` runs any of its `ToolDefinition`s on a shared three.js renderer with the same context Motion Builder gives them: the design unit (short side / 1080), premultiplied sRGB targets, `blit`, the param `integral`, and a seed.
  - `tools/mb.ts` wraps generators (and hybrid Tag Shader) as studio generators, and effects (Pixelado, ASCII, Spray, and Tag Shader on a layer) as raster effects that take the layer's bitmap as their source input.
  - `prepare()` is async: until it lands, the previous state draws (or nothing), the viewer redraws when it does, and the export waits for it.
  - KMR Apparat is commercial and isn't in the repo, so selects that default to it switch to the first free family (Archivo Narrow, Geist Mono, IBM Plex Mono).
- **Letters** needs one path per letter, so the Text generator now emits one path per glyph. Each letter is stretched vertically and sheared by its own swing (wave, alternate or random), pinned at its baseline. Animating `phase` is what makes "Hard Work"-style kinetic type.
- **Environments** (`model/environments.ts`) work like Motion Builder's: they filter what you can add, not what can open.
  - **Motion, Now**: KV tools, shape effects, studio templates and **Animate all** (the KV entrance on any comp).
  - **Inception**: the Motion Builder tools plus every effect.
  - **Spray**: Spray and its modes.
  - **Free**: everything.
- **Templates** (`model/templates.ts`) write real, editable keys at the playhead.
  - Studio: Fade in, Slide up, Pop, Spin in, Pixel build, Corner pin land, Radial unbend, Letters: wave loop, Letters: hard work.
  - Each Motion Builder tool also brings its own templates, spread over the layer's length. Their `expo` and `back` eases become custom beziers.
- **The Motion, Now KV** (`model/kv-import.ts`) comes in as layers. Blocks, the bracket and the headlines are vector layers (headlines use the KV fonts, with optional KV facets). The paper, grid, asterisk and lockup are bitmaps drawn by the KV render (`lib/kv`).

## Frontend

- **Tabs**: one per open project, each with its own undo history. **+ New** starts a Motion, Now comp in any format, or an Inception, Spray or Free project. Opening a project file opens a new tab. The workspace is saved to `playground:studio:workspace` (`lib/studio/workspace.ts`); the older single-project key migrates on first load.
- **Graph editor** (**Graph** in the timeline): curves of the properties whose keys are selected, else the selected layer's animated ones (up to 5, each in a chart colour).
  - Numbers plot their values; other properties plot each segment's progress 0 → 1.
  - Drag a key to move it in time (and in value, for numbers).
  - Drag a bezier handle to shape that segment: the key's ease becomes a custom `[x1, y1, x2, y2]`, shown as "Custom" in the inspector.
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
  - With a layer selected: name, restack, duplicate, delete and blend mode; the selected keys; Transform; Contents; and the effect stack (add, enable, reorder, remove).
  - **Curve editor** for the selected keys (`ui/curve-editor.tsx`): the ease out of the keys as a cubic-bezier in a 0–1 box with room to overshoot.
    - Drag the two handles to reshape it (one undo step per drag).
    - Presets (Linear, Easy ease, Ease in, Ease out, Expo, Back, Hold) are starting points.
    - A dot runs the curve in a loop so the timing can be felt (still under reduced motion).
    - With several keys selected, an edit sets them all; "mixed" shows when they differ.
    - The value field appears when one key is selected.
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
- `lib/motion-builder` and `three@0.169` for the Motion Builder tools; their free fonts are in `public/shared/fonts/mb/` (the KV fonts are in `public/shared/fonts/kv/`).
- `opentype.js` for outlines, WebGL2 for GL tools, WebCodecs and `mp4-muxer` for MP4.

## Component Tree

```
StudioApp            fonts gate, first tab, view prefs (useControls)
├─ TabBar            project tabs, + New (environment)
└─ Studio (per tab)            clock, selection, StudioContext, shortcuts, layout
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
| `lib/studio/model/` | types, eases (named or custom bezier), track evaluation, AE-style ops, specs, project defaults, KV import, demo, environments, templates |
| `lib/studio/engine/` | geometry (homography, subdivision), shape effects, pixel shape, letters, rasteriser, WebGL2 runner, Motion Builder host, param integral, evaluation, pipeline, compositor, tests |
| `lib/studio/tools/` | the tool contract, registry, Text, shapes, KV layer and paper, shape effects (incl. Letters), GL tools, the Motion Builder bridge |
| `lib/studio/ui/` | studio shell, tab bar, context, viewport and overlay, inspector, params, effects, keys, comp panel, toolbar, transport, shortcuts, environment filter |
| `lib/studio/timeline/` | rows builder, timeline, ruler, row name, row lane, layer bar, key drag, marquee, graph editor (math + view) |
| `lib/studio/{clock,workspace,handoff,fonts,export-mp4,prefs}.ts` | playhead, per-slug workspaces, mini tool → Studio, shared fonts, MP4, view prefs |
| `app/prototypes/studio/studio-app.tsx` | mounts the shared editor with tabs |
