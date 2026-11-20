# lib/kv: the Motion, Now poster core

Shared by the KV studio tools in the playground. It is ported from the KV Editor (`kv-editor/src/`, the old Vite sketch), and the drawing is kept identical.

- `model.ts`: composition JSON (`version: 1`, the same format the KV Editor saves), palettes, and `validate`.
- `layers.ts`, `presets.ts`: layer builders, the measured 16:9 master (`masterKV`), per-format layouts (`presetFor`), and `adaptTo`, which carries copy and colors into another format.
- `fonts.ts`: loads the OFL fonts from `/prototype-assets/kv-studio/fonts/` before the first paint.
- `render/render.ts`: the one `render(ctx, composition, { scale, fx })`.
  - `fx` is optional. It holds per-layer animation effects, applied in `render/fx.ts`: translate, scale and rotate around the layer centre, alpha, clip, and a hard-threshold pixelate.
  - With no `fx`, the render matches the KV Editor pixel for pixel.

Differences from the KV Editor:
- Video and GIF layers are skipped, and `validate` drops them. Their files live in the editor's IndexedDB.
- Long files are split along their existing seams: `outline`, `type-geometry` and `type`; `paper`, `text`, `image` and `bounds`.

The code is client-only, because it draws on canvas and uses `document`.
