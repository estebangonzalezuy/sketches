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

- **Layouts**: `stack` (stacked headline top-right, spiral), `cascade` (three flowers), `overlap` (one-line headline, two flowers), `vertical` (headline down the left edge, one big flower), `line` (line art: scalloped rosette, outlined type). `auto` picks one per seed.
- **Colour** (settings): `squares` (default) paints big flat colour fields behind and draws the rosettes and spirals as outlines with see-through interiors (each motif is drawn on its own layer with `destination-out` fills, then composited), headline and asterisk unboxed; `fills` colours the motifs themselves over a pastel mosaic.
- **New poster** rolls the seed. Changing any generator control (layout, seed, format, blocks) starts from that freshly generated poster; edits are remembered per settings in `playground:kv-posters:poster`.
- **Design**: headline options include **Outline only** and a colour; the asterisk has **Roundness** (sharp to round arm ends). Tap selects the front-most element (backgrounds lose to anything on top), drag moves it, the inspector edits text, size, petals, rotation, colours (multi-swatch for petal and band sets), box / vertical / scallop / ticks. Add: flower, scalloped flower, spiral, block, asterisk, text. Forward / backward / duplicate / delete. ⌘Z / ⇧⌘Z undo and redo (a slider drag is one step), Delete removes, Esc deselects.
- **Animate**: styles `build` (everything builds in, then holds), `loop` (finished poster, motifs spin), `build + loop`, `in + out` (builds in and back out, so it loops). Kinds start in order (blocks → frames → spirals/flowers → headline → lockup → asterisk), staggered top to bottom. Spin advances by whole rotational-symmetry periods, so loops are seamless. Scrub with the time slider; Space plays and pauses.
- **Paper texture**: a checkbox in the settings turns the paper grain on or off (preview, PNG and MP4 alike); Grain sets its strength.
- **Export**: PNG at the format's size; MP4 H.264 (VP9 fallback) at the chosen frame rate.
- **Responsive**: the poster sits on top, capped at `max-w-md`; panels below; settings in the side panel (desktop) or bottom sheet (mobile). Every button is a 44px target.
- **Reduced motion**: no autoplay; the playhead rests on the finished poster.
- **Theme**: chrome uses tokens; the poster uses its own palette (data).

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
```

## Error Handling

- Fonts that fail to load show an error instead of drawing with a fallback face.
- MP4 export reports a missing WebCodecs or unsupported size; cancel stops between frames.
- Storage failures only mean edits aren't remembered.

## File Structure

```
types.ts data.ts random.ts mosaic.ts elements.ts layouts.ts generate.ts(+test)
animate.ts(+test) bounds.ts render.ts draw-frame.ts draw-shapes.ts draw-flower.ts draw-spiral.ts draw-type.ts
store.ts use-playhead.ts use-reduced-motion.ts export-mp4.ts
kv-posters.tsx poster-editor.tsx poster-canvas.tsx design-panel.tsx add-menu.tsx element-inspector.tsx fields.tsx animate-panel.tsx
```
