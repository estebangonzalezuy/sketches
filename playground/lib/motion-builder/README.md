# lib/motion-builder

The Motion Builder tool set (`motion-builder/`, the old Vite sketch), ported as is so the playground Studio can run it:

- `core/tool.ts`: the `ToolDefinition` contract (params, `prepare`/`render` on a three.js render target, presets, animation templates).
- `core/random.ts`
- `tools/`: Text, Tag Shader, Text Extruder, ASCII, Chart, Table, Counter, Pixelado, Spray and its 7 modes.

The editor and the engine aren't ported; the Studio's `engine/mb-host.ts` supplies the render context. The only changes from the original are:
- Font URLs point to `/prototype-assets/studio/fonts/`.
- Two typed-array casts for this TypeScript version.
- One comma expression is rewritten for lint.

KMR Apparat is commercial and isn't included.
