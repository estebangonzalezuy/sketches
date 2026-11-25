# KV Posters

## What It Does

Generates Motion, Now posters in the style of the flower/rosette references (cream paper, construction grid, crop marks, painted colour squares, outlined rosettes and spirals, KV-treated type), lets you edit every element, and animates the result into an MP4.

## Architecture

```
controls (layout, seed, format, palette, blocks)
        │
        ▼
generate(options, measure)            pure, seeded (random.ts, mosaic.ts, layouts.ts, elements.ts)
        │  Poster { elements[] }
        ▼
store.ts ── saved edits keyed by the generator settings (+ undo / redo) ──► usePoster()
        │
        ├─ Design tab: tap → hit() selects, drag → moved(), inspector edits fields
        │
        └─ Animate tab: animate(poster, t, settings) → Map<id, { p, spin }>   pure
                                        │
                     render(ctx, poster, palette, { anim })   ← same call for canvas, PNG, every MP4 frame
                                        │
                          export-mp4.ts (WebCodecs + mp4-muxer)
```

## Frontend

- **Layouts**: `stack` (stacked headline top-right, spiral), `cascade` (three flowers), `overlap` (one-line headline, two flowers), `vertical` (headline down the left edge, one big flower), `line` (line art: scalloped rosette, outlined type), `free` (one to three motifs anywhere). `auto` picks one per seed. Layouts are starting points: `vary.ts` moves, scales, turns and re-petals the motifs per seed, often re-splits, resizes and re-places the headline (sometimes vertical), swaps the lockup and asterisk corners, and flips a coin for each box's outline.
- **Colour** (settings): `squares` (default) paints big flat colour fields behind and draws the rosettes and spirals as outlines with see-through interiors (each motif is drawn on its own layer with `destination-out` fills, then composited), headline and asterisk unboxed; `fills` colours the motifs themselves over a pastel mosaic.
- **New poster** rolls the seed. Changing any generator control (layout, seed, format, blocks) starts from that freshly generated poster; edits are remembered per settings in `playground:kv-posters:poster`.
- **Design**: headline and lockup options include **Outline only** and a colour; any box can drop its outline (**Box outline**); the asterisk has **Roundness** (sharp to round arm ends). Tap selects the front-most element (backgrounds lose to anything on top), drag moves it, the inspector edits text, size, petals, rotation, colours (multi-swatch for petal and band sets), box / vertical / scallop / ticks. Add: flower, scalloped flower, spiral, block, asterisk, text. Forward / backward / duplicate / delete. ⌘Z / ⇧⌘Z undo and redo (a slider drag is one step), Delete removes, Esc deselects.
- **Timeline** (Animate tab): a seconds ruler and one row per element, front-most first. Each row's bar is when that element animates: drag the middle to move it, drag near an end to stretch it (snaps to frames), tap empty lane space to scrub. Muted bars are the automatic timing; a bar becomes hand-set (solid) once touched and is stored on the element as `anim: { start, end, effect, ease? }` (fractions of the length), so it saves and undoes with the poster. Selecting a row (or tapping the element on the canvas) opens its clip: **Effect** (KV build, fade, rise, drop, slide in, scale, spin in; `effects.ts` applies the generic ones around the finished element), **Own easing** (the Studio curve editor, else the global curve) and **Auto** to drop the hand-set timing. In `in + out`, each clip plays in and mirrors out (`min(clip(u), clip(1 − u))`), so loops still close.
- **Construct** (animation style): a brand-reveal build for every element. `outlines.ts` turns each element into its outlines (polylines) plus bezier anchors and handles (ellipses get the four kappa handles a vector app shows; type contours get a few node anchors); `construct.ts` draws, per element progress: a dashed bounding box with corner ticks, centre cross and size label, then the outlines drawing on with anchors, handles and a pen tip riding along, then the finished element snaps in (a 3.5% fade, almost no opacity ramp) while the technical marks fade out. Timing still comes from the timeline bars. It is also available per element as the **Construct** effect. **Construct notes** (settings): before an outline draws, its box is typed in with a caret, word-wrapped to the box, then cleared as the outline arrives. `questions` (default): the survey's questions (`questions.ts`): the headline types the lead question ("What does motion mean now?") and then constructs into the title; the other elements type "Qnn / total" and a question, biggest boxes first, wrapping round the list. The questions are edited in the Animate tab (**Survey questions**, one per line, plus the headline question) and stored as `playground:kv-posters:questions`; the defaults are placeholders. `specs`: technical notes (`notes.ts`: name, font and size, petals and diameter, colour and hex). `off`: straight to the outlines.
- **Animate**: styles `build` (everything builds in, then holds), `loop` (finished poster, motifs spin), `build + loop`, `in + out` (builds in and back out, so it loops). Kinds start in order (blocks → frames → spirals/flowers → headline → lockup → asterisk), staggered top to bottom. Spin advances by whole rotational-symmetry periods, so loops are seamless. Scrub with the time slider; Space plays and pauses. **Easing**: the Studio's curve editor (`lib/studio/ui/curve-editor.tsx`) shapes each element's build (drag the two bezier handles or start from a preset; stored as `playground:kv-posters:ease`); spins stay linear so loops close.
- **Paper texture**: a checkbox turns the grain on or off; Grain sets its strength. It is a seeded noise tile laid in device pixels over the whole print (paper, colour and ink), so it reads the same in the preview, the PNG and the MP4.
- **Formats**: motif and mark sizes use a unit `U = min(width, height × 0.75)` (the width on 3:4 and taller), so 1:1 and 4:5 don't overflow; the canvas resizes both sides on a format change.
- **Export**: PNG at the format's size; MP4 H.264 (VP9 fallback) at the chosen frame rate (12, 24, 30 or 60 fps).
- **Responsive**: the poster sits on top, capped at `max-w-md`; panels below; settings in the side panel (desktop) or bottom sheet (mobile). Every button is a 44px target.
- **Reduced motion**: no autoplay; the playhead rests on the finished poster.
- **Theme**: chrome uses tokens; the poster uses its own palette (data). Palettes: Pastel, KV yellow, and the 31 tMSC background / figure pairs (`palettes.ts`): paper = background, ink = figure (type and lines), boxes take the background, motifs take the rest of the tMSC set, never the pair's own colours.

## Key Dependencies

- `lib/kv/fonts.ts` and `lib/kv/render/type.ts`: headlines are Archivo Narrow Bold with the KV type treatment (facets, keyhole notches, round dots, printed-ink edge), the same pipeline as the Studio's Letters cell; in line art they are outlined. The lockup is Inter SemiBold.
- `mp4-muxer` + WebCodecs `VideoEncoder`.

## Component Tree

```
KvPosters            controls, font gate, ControlsLayout
└─ PosterEditor      usePoster, tabs, playhead, shortcuts, PNG
   ├─ PosterCanvas   render() + tap / drag + selection outline
   ├─ DesignPanel    new poster, AddMenu, undo/redo, selected element actions
   │  └─ ElementInspector → fields.tsx (NumberField, SwitchField, TextField, SwatchField)
   └─ AnimatePanel   play, scrub, MP4 export with progress and cancel
      ├─ Timeline     ruler + one TimelineLane per element, each with a ClipBar
      └─ ClipEditor   effect, own easing (CurveEditor), back to automatic
```

## Error Handling

- Fonts that fail to load show an error instead of drawing with a fallback face.
- MP4 export reports a missing WebCodecs or unsupported size; cancel stops between frames.
- Storage failures only mean edits aren't remembered.

## File Structure

```
types.ts data.ts palettes.ts(+test) random.ts mosaic.ts elements.ts layouts.ts vary.ts generate.ts(+test)
animate.ts(+test) effects.ts construct.ts notes.ts questions.ts(+test) outlines.ts bounds.ts render.ts draw-frame.ts draw-shapes.ts draw-flower.ts draw-spiral.ts draw-type.ts
store.ts use-playhead.ts use-reduced-motion.ts export-mp4.ts
kv-posters.tsx poster-editor.tsx poster-canvas.tsx design-panel.tsx add-menu.tsx element-inspector.tsx fields.tsx animate-panel.tsx questions-editor.tsx timeline.tsx timeline-lane.tsx clip-bar.tsx clip-editor.tsx
```
