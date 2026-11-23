# Wave

## What It Does

A travelling sine wave through type, in WebGL. A mini tool: one effect of the Studio on its own, with the full After Effects-style timeline, so it can be shared or used when only this effect needs animating.

## Architecture

```
wave-app.tsx ──► StudioEditor(slug="wave", environment="fx:wave", handoff)     lib/studio/ui/editor.tsx
                     │
                     ├─ workspace("wave")       one project, undo, saved to playground:wave:workspace
                     ├─ environment fx:wave  text/rectangle layers, this effect only, its templates
                     └─ Open in Studio ──► sendToStudio(): a new tab in the Studio (Free environment)
```

The engine (model, timeline, compositor, tools) is shared with the Studio and the other mini tools in `lib/studio/` (see its README).

**The effect:** The layer is rasterised and displaced by a travelling sine wave in a WebGL2 fragment shader; amplitude, wavelength, speed and direction are animatable.

## Frontend

- **Layout**: viewer, inspector (effect controls) and timeline, the same as the Studio, without project tabs. Below lg, the viewer stacks over Timeline / Layer tabs.
- **Timeline**: a stopwatch on every property, key drag with box select, layer bars, a ruler scrub and the graph editor with bezier handles. Selected keys get a curve editor in the inspector (drag the handles or start from a preset).
- **Templates** for this effect are under Layer → Animate, and write keys at the playhead. Applying one again later chains it.
- **Shortcuts**: Space, ←/→, Home/End, Delete, F9, ⌘Z/⇧⌘Z.
- The **View** controls (preview quality, motion paths, handles) come from the playground control panel, with Reset and Randomize.
- **Reduced motion**: there's no autoplay, and the playhead rests on the last frame.

## Key Dependencies

`lib/studio` (and, through it, `lib/kv` fonts and outlines), `opentype.js`, WebGL2, WebCodecs + `mp4-muxer`.

## Component Tree

```
WaveApp
└─ StudioEditor → Studio (Toolbar with Open in Studio, Viewport + Overlay, Transport, Inspector | CompPanel, Timeline)
```

## Error Handling

Fonts that fail to load show a message instead of a fallback face. A bad project file shows a toast. An MP4 export without WebCodecs explains why.

## File Structure

| File | What |
| --- | --- |
| `page.tsx`, `metadata.json` | entry and gallery metadata |
| `wave-app.tsx` | mounts the shared editor for this effect |
