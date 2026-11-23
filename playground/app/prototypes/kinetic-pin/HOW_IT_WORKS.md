# Kinetic Pin

## What It Does

Words stacked vertically ("HARD" over "WORK"), each warped by four corner pins with a true perspective (homography) map. The pins between two words are shared, and they snap in opposition in a seamless loop. The loop exports as MP4.

## Architecture

```
dials (useControls) + words input
        │
drawFrame(renderer, settings, text, t)                       frame.ts — preview and every MP4 frame
  words → wordTexture(): white glyphs on transparent, cropped to the ink box (no padding)
  restStack(): words stacked edge to edge, as wide as the stack, fit and centred
  quadsAt(t): shared edge k has its own L_k / R_k
        L_k.y = rest + A·h̄·swing(t − (k−1)·phase·loop)   R_k.y = rest − same
        outer top, outer bottom and both sides never move
  PinRenderer.render(): per word, a full-screen pass; each pixel → inverse homography →
        word texture uv (outside the unit square: discarded) → ink × alpha over the ground
```

- **Homography, not affine.** `squareToQuad` and `invert3` (from `lib/studio/engine/geometry.ts`) build the projective map from the word's unit square to its quad, and its inverse. The fragment shader divides by `q.z`, so the perspective reads.
- **Shared middle edge.** Word i's bottom-left and bottom-right are word i+1's top-left and top-right: the same two points, `L` and `R`. The quads always meet with no gap.
- **The loop.** `swing(t)` goes 0 → 1 → 0 over the loop length: at rest at t = 0, full pose at half the loop (L down, R up), rest again at the end, so the loop is seamless.
  - Each half is eased by `cubic-bezier(s, 0, 1 − s, 1)`, with `s` = **Ease steepness** (0.8 by default, i.e. `cubic-bezier(0.8, 0, 0.2, 1)`).
  - A steep curve holds long at both extremes and snaps through the middle.
- **N words** give N − 1 shared edges, each with its own L/R pair. **Phase offset** starts each edge that fraction of a loop after the one above.

## Frontend

- **Dials** (control panel, persisted, with Reset and Randomize):
  - motion: amplitude (fraction of the mean word height), loop length, ease steepness, number of words, phase offset
  - look: margin, ink and ground colours
  - export: format (4:5, 1:1, 9:16, 16:9), export fps (60/30), export loops
- **Words**: a text field under the canvas. Words are split on spaces, upper-cased, and repeated in order to fill N.
- **Preview**: a WebGL2 canvas at the device's pixel ratio in the chosen format. The loop reads the dials through refs, so moving a dial never restarts it.
- **MP4**: whole loops at the format's full size (1080 px short side), from the same `drawFrame` as the preview, encoded with WebCodecs (H.264, VP9 fallback) and `mp4-muxer`. Never GIF.
- **Reduced motion**: one still frame at the full pose, which still follows the dials.
- **Mobile**: the canvas sits on top and the dials live in the bottom sheet. No horizontal scroll.

## Key Dependencies

- WebGL2 for the warped quads.
- `lib/studio/engine/geometry.ts` (homography) and `lib/studio/model/ease.ts` (cubic-bezier).
- Archivo Narrow (OFL) from `public/shared/fonts/mb/`.
- WebCodecs and `mp4-muxer` for the export.

## Component Tree

```
KineticPin          ControlsLayout + font gate
├─ PinCanvas        WebGL2 preview loop (PinRenderer, drawFrame)
├─ Input            words
└─ ExportButton     exportMP4, progress, cancel
```

## Error Handling

- If the font fails to load, a message is shown instead of a fallback face.
- If WebGL2 is missing, the renderer throws a readable error.
- If WebCodecs or the codec is missing, the export shows a toast saying why. Pressing the export button again cancels.

## File Structure

| File | What |
| --- | --- |
| `page.tsx`, `metadata.json` | entry and gallery metadata |
| `kinetic-pin.tsx` | root: dials, font gate, canvas, words, export |
| `data.ts`, `types.ts` | control schema, formats, texture size; types |
| `motion.ts` (+ `motion.test.ts`) | pure: swing, steep curve, stack layout, quads with shared edges, word list |
| `word-textures.ts` | font loading, glyph-tight word textures |
| `renderer.ts` | WebGL2 homography renderer |
| `frame.ts` | one frame, preview or export |
| `pin-canvas.tsx`, `use-reduced-motion.ts` | live preview |
| `export-mp4.ts`, `export-button.tsx` | MP4 export |
