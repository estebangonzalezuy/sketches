# lib/studio

The motion studio engine shared by the Studio (`app/prototypes/studio`) and its mini tools (`corner-pin`, `pixel-shape`, `radial-warp`, `kinetic-letters`, `wave`).

| Path | What |
| --- | --- |
| `model/` | project types, eases (named or custom bezier), track evaluation, AE-style ops, environments (incl. one `fx:<effect>` per mini tool), templates, demos |
| `engine/` | geometry and shape effects, rasteriser, WebGL2 runner, Motion Builder host, compositor; pure and tested |
| `tools/` | the tool contract and every generator and effect (studio and Motion Builder) |
| `timeline/` | the After Effects timeline and graph editor |
| `ui/` | the editor: `editor.tsx` (`StudioEditor`), shell, viewer, inspector, toolbar, tabs |
| `workspace.ts`, `use-workspace.ts` | per-slug workspaces (tabs, undo), saved to `playground:<slug>:workspace` |
| `handoff.ts` | `sendToStudio()`: a mini tool's project opens as a new Studio tab |
| `fonts.ts` | loads the KV and Motion Builder fonts from `public/shared/fonts/` |

## Mount it

```tsx
<StudioEditor slug="studio" tabs />                                   // the Studio
<StudioEditor slug="corner-pin" environment="fx:corner-pin" handoff /> // a mini tool
```

## Add a mini tool

1. Write the effect in `tools/` and register it in `tools/registry.ts`.
2. Add an `FxDemo` to `model/fx-demos.ts` (effect id, its templates, a demo project). This creates the `fx:<effect>` environment.
3. Add a prototype folder that mounts `<StudioEditor slug="<slug>" environment="fx:<effect>" handoff />`.
