# KV Posters

## What It Does

Generates Motion, Now posters in the style of the flower/rosette references (cream paper, construction grid, crop marks, pastel mosaics, outlined flowers and spirals, heavy condensed type), lets you edit every element, and animates the result into an MP4.

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

- **Layouts** (the five references): `stack` (stacked headline top-right, spiral over nested frames), `cascade` (three flowers over a mosaic and a rainbow arc), `overlap` (one-line headline, two overlapping flowers), `vertical` (headline down the left edge, flower in rings), `line` (line art: scalloped rosette, outlined type). `auto` picks one per seed.
- **New poster** rolls the seed. Changing any generator control (layout, seed, format, blocks) starts from that freshly generated poster; edits are remembered per settings in `playground:kv-posters:poster`.
- **Design**: tap selects the front-most element (backgrounds lose to anything on top), drag moves it, the inspector edits text, size, petals, rotation, colours (multi-swatch for petal and band sets), box / vertical / scallop / ticks. Add: flower, scalloped flower, spiral, arc, block, asterisk, text. Forward / backward / duplicate / delete. ⌘Z / ⇧⌘Z undo and redo (a slider drag is one step), Delete removes, Esc deselects.
- **Animate**: styles `build` (everything builds in, then holds), `loop` (finished poster, motifs spin), `build + loop`, `in + out` (builds in and back out, so it loops). Kinds start in order (blocks → frames → arcs → spirals/flowers → headline → lockup → asterisk), staggered top to bottom. Spin advances by whole rotational-symmetry periods, so loops are seamless. Scrub with the time slider; Space plays and pauses.
- **Export**: PNG at the format's size; MP4 H.264 (VP9 fallback) at the chosen frame rate.
- **Responsive**: the poster sits on top, capped at `max-w-md`; panels below; settings in the side panel (desktop) or bottom sheet (mobile). Every button is a 44px target.
- **Reduced motion**: no autoplay; the playhead rests on the finished poster.
- **Theme**: chrome uses tokens; the poster uses its own palette (data).

## Key Dependencies

- `lib/kv/fonts.ts`: loads the shared KV fonts; headlines are Barlow Condensed Black outlines via opentype.js, the lockup is Inter SemiBold.
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
