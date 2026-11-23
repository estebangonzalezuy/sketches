# Motion, Now — How It Works

## What It Does

The index for the tMSC: Motion, Now 2026 report tools: a title and a numbered list linking
to the six interactive tools.

## Architecture

```
data.ts (TOOLS) ─▶ ToolList ─▶ <Link href="/prototypes/<slug>">
fonts.ts (next/font/local, Archivo Narrow from public/shared/fonts/tmsc)
```

## Frontend

- Server-rendered, no client JS of its own. Single centered column, token colors, Archivo
  Narrow. Each row is a full-width link (≥ 44 px) with a hover and active state.

## API

None.

## Key Dependencies

`next/font/local`, `lucide-react`.

## Component Tree

```
Page
└── MotionNowIndex
    └── ToolList
```

## Error Handling

None needed: static links.

## File Structure

```
motion-now/
├── page.tsx, metadata.json, HOW_IT_WORKS.md
├── data.ts               the six tools
├── fonts.ts              Archivo Narrow via next/font/local
├── tool-list.tsx
└── motion-now-index.tsx
```

## Shared code for the six tools

- `lib/tmsc/` — brand palettes, example survey (seeded), stats, easing, fonts, PNG/video
  export, zip writer.
- `components/tmsc/` — `Stage` (canvas locked to the export size), export buttons,
  `DataEditor`, `usePersistent`, `useLiveRecording`, respondents editor.
