# Rules for agents

This repo holds two separate things. Know which one you are working on.

| Folder | What | Stack | Deploy |
| --- | --- | --- | --- |
| `playground/` | **The prototype playground.** All new prototypes go here. | Next.js 16 (App Router), Tailwind 4, shadcn/ui | Its own Vercel project (Root Directory `playground`) |
| everything else | The older Vite sketches site served at `estebangonzalez.co/sketches` (see `README.md`) | Vite + React | The original Vercel project |

Unless the owner names one of the old sketches, "make a prototype", "build me a …", "add a …
toy/game/tool" means a new prototype in `playground/`. Never touch the old sketches while
doing playground work, and never add playground code outside `playground/`.

Run every command below from `playground/`.

---

## 1. How the playground works

```
playground/
├── app/
│   ├── page.tsx                  gallery (search, tags, hidden toggle, static thumbnails)
│   ├── layout.tsx                root layout, ThemeProvider (dark by default), fonts
│   ├── login/ , api/auth/        password gate UI and route
│   ├── prototypes/
│   │   ├── layout.tsx            slim bar: back to gallery, title, theme toggle
│   │   ├── [slug]/page.tsx       404 for anything that is not a prototype folder
│   │   └── <slug>/               ONE FOLDER PER PROTOTYPE
│   ├── p/[slug]/page.tsx         public route: same component, no login, og:image + og:video
│   └── api/<slug>/…              API routes, one folder per prototype that needs them
├── components/
│   ├── ui/                       shadcn/ui, every component installed
│   ├── controls/                 control panel library (schema → panel, persistence, Reset, Randomize)
│   ├── motion/collapse.tsx       height open/close animation
│   ├── gallery/ , site/          app chrome (gallery, bar, theme toggle)
├── lib/
│   ├── prototypes.ts             discovers prototypes, reads metadata.json (server only)
│   ├── metadata-schema.ts        metadata type + validation
│   ├── storage.ts                safe, namespaced localStorage
│   ├── auth.ts                   password gate helpers
│   └── generated/                written by scripts/gen-registry.ts, git-ignored, never edit
├── proxy.ts                      the gate (Next 16 renamed middleware → proxy)
├── public/thumbnails/            <slug>-light.jpg, <slug>-dark.jpg
├── public/og/                    <slug>.png, <slug>.mp4 (public prototypes only)
├── public/prototype-assets/<slug>/  static files a prototype needs
└── scripts/                      registry, thumbnails, og capture
```

- **Discovery is automatic.** A folder in `app/prototypes/` with `page.tsx`,
  `metadata.json` and `HOW_IT_WORKS.md` is a prototype. There is no list to edit.
  `npm run registry` (run automatically before dev, build, lint, typecheck and test)
  validates every `metadata.json` and fails loudly on a missing file or bad field.
- **Privacy.** In production (Vercel production and previews, `next start`) every page
  needs the password in `PLAYGROUND_PASSWORD`. `npm run dev` has no gate.
  Prototypes are private by default. With `"public": true` a prototype is also served at
  `/p/<slug>` without login, together with `/og/<slug>.*`, `/api/<slug>/*` and
  `/prototype-assets/<slug>/*`. Unknown or private slugs on those paths return 404, never a
  login redirect, so private names don't leak.
- **Gallery** is built at build time from metadata, sorted by `updatedAt`. Cards show
  static thumbnails (light and dark, switched by CSS). Never embed live iframes.
- **Next.js 16 is newer than your training data.** `middleware.ts` is now `proxy.ts`;
  `params` and `searchParams` are Promises; `PageProps<"/route">` / `LayoutProps` are
  global generated types. Cache Components is deliberately **off** in `next.config.ts`.
  When unsure, read `node_modules/next/dist/docs/` before writing code.

---

## 2. Creating a new prototype (start to pull request)

1. **Branch.** Work on the branch you were given, or create `prototype/<slug>`.
2. **Pick a slug**: short kebab-case (`gravity-wells`), not already in `app/prototypes/`.
3. **Create the folder** `app/prototypes/<slug>/`. Copy the shape of
   `app/prototypes/flow-field/` (the reference example; it follows every rule below).
   - `metadata.json` (see §3.1). `createdAt` today, `updatedAt` now,
     `"hidden": false`, `"public": false`.
   - `page.tsx`: thin server entry, ~10 lines:
     ```tsx
     import { prototypeMetadata } from "@/lib/prototype-page";
     import meta from "./metadata.json";
     import { MyThing } from "./my-thing";

     export const metadata = prototypeMetadata(meta);

     export default function Page() {
       return <MyThing />;
     }
     ```
     The page must take no props: `/p/<slug>` renders the same default export.
   - The client root component (`"use client"`) plus the split files from §3.3.
   - `HOW_IT_WORKS.md` (see §3.2).
   - API routes, if any, in `app/api/<slug>/…/route.ts`.
   - Static files, if any, in `public/prototype-assets/<slug>/`.
4. **Build only what was asked.** Re-read the request. Cut anything extra.
5. **Check it**: `npm run dev`, open `http://localhost:3000/prototypes/<slug>` at 375px wide
   and at desktop width, in dark and light. A Playwright script in your scratchpad is the
   fastest way (Chromium is preinstalled; `require("playwright")` works).
6. **Thumbnails**: `npm run thumbnails -- <slug>`. Open both JPGs and look at them.
7. **Verify**: `npm run check` (lint, typecheck, tests, production build). All must pass.
8. **Commit** the folder, the thumbnails and any shared changes together. Push.
9. **Open a pull request** against `main`. Title: `Playground: <Title>`.
10. **Post the preview link** (see §4) as the last thing you say, so the owner can open it
    from their phone. Link straight to `/prototypes/<slug>` on the preview.

Never add a "new prototype" button, form or API to the app. Prototypes are only ever
created by an agent, in code, like this.

---

## 3. Rules for every prototype (non-negotiable)

### 3.1 Metadata

Every prototype has `metadata.json`:

```json
{
  "title": "My Prototype",
  "description": "What it does, one sentence.",
  "tags": ["tag1"],
  "createdAt": "YYYY-MM-DD",
  "updatedAt": "2026-01-31T14:05:00.000Z",
  "hidden": false,
  "public": false
}
```

- **Bump `updatedAt` on every edit** to the prototype (use the real current time,
  `date -u +%Y-%m-%dT%H:%M:%S.000Z`). The gallery is sorted by it.
- Tags: lowercase, few, reuse existing ones (`grep -h '"tags"' app/prototypes/*/metadata.json`).
- `"public": true` **only when the owner explicitly asks for that specific prototype** to
  be public. Never as a side effect, never "for testing". See §3.12.

### 3.2 Documentation

Every prototype has `HOW_IT_WORKS.md`, updated in the same commit as any change:

- **What It Does**: 1–2 sentences.
- **Architecture**: ASCII data-flow diagram.
- **Frontend** / **API**: state, shortcuts, responsive behavior, request/response shapes.
- **AI Usage** (only if a model is called): model ID, why that model, how it's called,
  key parameters, system prompt summary, user prompt shape.
- **Key Dependencies**, **Component Tree**, **Error Handling**, **File Structure**.

### 3.3 Self-contained and decomposed

- A prototype lives entirely in its own folder (plus its `api/<slug>` and
  `prototype-assets/<slug>` if needed). It never imports from another prototype. Shared
  code goes in `components/` or `lib/` only when it is genuinely reusable.
- Never write one giant file. `page.tsx` stays thin. Split out:
  - `types.ts`: shared types
  - `data.ts`: mock data, constants, config, the control schema
  - pure logic files (`simulation.ts`, `search.ts`, `utils.ts`): no React, no DOM, testable.
    Add a `*.test.ts` next to non-trivial logic (vitest, `npm test`).
  - one file per meaningful UI component, named for what it is (`score-board.tsx`, not `Component2.tsx`).
- Aim for files under ~150 lines. If a file grows past that, split it.

### 3.4 Design system

- Use the shared components in `components/ui/` and the design tokens:
  `bg-background`, `text-foreground`, `bg-card`, `bg-muted`, `text-muted-foreground`,
  `bg-primary`, `text-primary-foreground`, `border-border`, `ring-ring`, `bg-accent`,
  `text-destructive`, `chart-1…5`.
- **Never hardcode colors**: no `bg-black`, `text-white`, `bg-blue-500`, hex values,
  `rgb()`, or inline `style={{ color }}`. Exceptions: colors the *user* picks (a color
  control value is data), and canvas/WebGL, which must read the tokens from CSS (see
  `app/prototypes/flow-field/canvas-colors.ts`).
- **Read the component source before using a prop.** These are shadcn "radix-nova"
  components and they differ from the docs you remember (e.g. `Button` sizes are
  `default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg`; `Slider` takes arrays;
  `cn` comes from the `cn` package). Open `components/ui/<name>.tsx` first.
- Need a component that isn't installed? `npx shadcn@latest add <name>`. Never hand-copy
  one from memory.
- Icons: `lucide-react`, only when they carry meaning (a button's action). No decorative icons.

### 3.5 Clean and minimal by default

- Start with a single centered column: `mx-auto w-full max-w-2xl px-4`. No sidebars,
  split panels or tab-heavy layouts unless asked. (The control panel is the one
  exception and it uses `ControlsLayout`.)
- Build only what was asked. No extra dashboards, charts, stats, settings, onboarding,
  or "nice to have" views.
- Fewer elements is better; every element must justify itself. Plain `outline` badges
  over colorful ones.
- Minimal copy. No captions that restate a label, no hints nobody needs, no
  "Welcome to…" headers. The prototype bar already shows the title.

### 3.6 Control panels

Anything with tunable parameters (speed, color, size, count, mode) gets a control panel
built with `components/controls`, never scattered inputs:

```tsx
// data.ts
export const controls = defineControls({
  speed: { type: "number", label: "Speed", min: 0, max: 5, step: 0.1, default: 1 },
  trails: { type: "boolean", label: "Trails", default: true },
  shape: { type: "select", label: "Shape", options: ["circle", "square"], default: "circle" },
  tint: { type: "color", label: "Tint", default: "#7c5cff" },
  count: { type: "number", min: 1, max: 5000, step: 1, default: 800, randomize: false },
});

// my-thing.tsx
const c = useControls("<slug>", controls);   // values persist per prototype
return <ControlsLayout controls={c}>…subject using c.values…</ControlsLayout>;
```

- You get the panel, localStorage persistence, **Reset** and **Randomize** for free.
  Every panel has both; don't remove them.
- `ControlsLayout` puts the panel at the side on desktop (≥ lg) so it never covers the
  subject, and a floating button + non-modal bottom sheet (≤ 45% height) on mobile.
  Put the subject at the top of the page on mobile so it stays visible above the sheet.
- Use `randomize: false` for controls where a random value would be useless or slow.
- Animation loops read values through a ref (see `flow-field-canvas.tsx`) so moving a
  slider never restarts the loop.

### 3.7 Mobile first

- Everything works at **375px** wide. No horizontal page scroll, ever
  (`document.documentElement.scrollWidth === innerWidth`).
- **Tap targets ≥ 44×44px.** `app/globals.css` enforces a 44px minimum on touch screens
  for elements with `data-slot="button" | "toggle" | "select-trigger" | "tabs-trigger" |
  "input" | "native-select"`. Anything else, or a `Button` rendered through another
  component's `asChild` trigger (which replaces `data-slot`), needs an explicit
  `size-11` / `min-h-11`.
- Icon-only buttons on mobile, labels from `sm:` up:
  `<Button size="icon" className="sm:w-auto sm:px-2.5"><Icon /><span className="hidden sm:inline">Label</span></Button>`
  and always an `aria-label`.
- No hover-only interactions. Every hover state has a visible touch equivalent
  (`active:`, a tap, or always-visible UI).
- Code blocks wrap (`whitespace-pre-wrap break-words`); nothing scrolls sideways.
- Modals, lightboxes and carousels need visible prev/next buttons or swipe on mobile,
  not just keyboard shortcuts.
- Respect safe areas for fixed UI: `env(safe-area-inset-bottom)` etc.

### 3.8 Light and dark mode

- Design dark-first (the default theme). Light must also look right; tokens do this for you.
- Never put a `dark` class (or `data-theme`) on a page or wrapper. The theme is global.
- Use `useTheme()` / `resolvedTheme` only when **behavior** must change by theme,
  e.g. canvas or WebGL colors. Read token values with `getComputedStyle`.
- Check both themes before committing; thumbnails are captured in both.

### 3.9 Motion

- Rows or sections the user adds or removes animate their height open and closed. Use
  `components/motion/collapse.tsx`. Nothing pops in and makes the page jump.
- Smooth deceleration (`ease-out-smooth`, the default transition curve). No bouncy
  overshoot, no spring wobble.
- Respect `prefers-reduced-motion`: CSS animations are neutralized globally in
  `globals.css`; JS/canvas loops must check it themselves (see
  `flow-field/use-reduced-motion.ts`) and show a still or a calm version.
- **Verify animations actually run**: in Playwright, read
  `getComputedStyle(el).transitionDuration` / `animationName` and screenshot mid-animation.
  Utility classes silently do nothing if their CSS isn't loaded.

### 3.10 AI-backed prototypes

- Call models server-side from `app/api/<slug>/…/route.ts`. Never expose keys to the
  client, never prefix them `NEXT_PUBLIC_`. Keys live in Vercel env vars.
- Default to the latest, most capable model unless speed/cost clearly matters; record the
  choice and why in HOW_IT_WORKS.md.
- If a model generates UI or layout, put explicit layout constraints in the system prompt
  (max columns, max width, no wide tables). Defensive CSS is a backup, not the fix.
- Parse JSON from model output defensively: extract the first `{…}` block, `try/catch`
  the parse, validate the shape, and show a readable error if it fails.
- Wrap every API route in `try/catch` and return proper status codes (400 bad input,
  401/403, 429, 500, 502 upstream failure) with `{ error }` JSON.

### 3.11 Storage

- Use `lib/storage.ts` (`readStorage`, `writeStorage`, `storageKey`). It wraps every
  `localStorage` access in try/catch.
- Load on mount, never during server render (`useSyncExternalStore` with a server
  snapshot, or an effect). Server HTML must not depend on storage.
- Namespace keys per prototype: `storageKey("<slug>", "key")` → `playground:<slug>:key`.

### 3.12 Thumbnails and social previews

- New prototype or any visual change → `npm run thumbnails -- <slug>` and commit the two
  JPGs **in the same commit** as the change.
- Global style change (globals.css, components/ui, layout chrome) → `npm run thumbnails`
  (all).
- `npm run thumbnails -- --missing` fills gaps; several: `npm run thumbnails -- a b c`;
  `--no-build` reuses the current build.
- **Open and look at every captured image** before committing. A stale or broken
  thumbnail is worse than none (a missing one shows "No preview yet").
- Thumbnails hide the prototype bar and anything with `data-capture-hide` (the control
  panel). Add `data-capture-hide` to other overlays that shouldn't be in the picture.
- When (and only when) the owner asks to make a prototype public: set `"public": true`,
  bump `updatedAt`, run `npm run og -- <slug>` (writes `public/og/<slug>.png` 1200×630 and
  `public/og/<slug>.mp4`, 6 s H.264; needs ffmpeg), look at both, commit them, and share
  the `/p/<slug>` link. A public prototype must always have both og files.

---

## 4. Workflow rules

- **Branch, push, pull request.** Never commit to `main`. Push with
  `git push -u origin <branch>`. Open a PR when done; the PR runs the Vercel build check
  and creates a preview deployment.
- **Before finishing**, from `playground/`: `npm run check` (= lint + typecheck + test +
  production build). Fix everything it reports. Don't skip or disable checks.
- **End every task with the preview link**, pointing at the prototype:
  `https://<preview-host>/prototypes/<slug>`. Find it in the Vercel bot comment or status
  on the PR, or via the Vercel API (`GET /v6/deployments?projectId=…&meta-githubCommitRef=<branch>`).
  If it isn't ready yet, say so and give the PR link.
- Previews are password-gated like production; the owner signs in once per preview host.
- Dependencies: install inside `playground/` (`npm install <pkg>`), commit
  `package.json` and `package-lock.json`. Prefer libraries from §5.
- Don't edit `lib/generated/` (generated) or hand-edit `components/ui/` unless fixing a
  real bug (note why in a comment).
- **The rules file grows.** When something goes wrong and gets fixed, add a one-line
  lesson to §6 in the same PR so it doesn't happen again.

---

## 5. Suggested libraries

Add as needed, inside `playground/`.

| Need | Use |
| --- | --- |
| 3D / WebGL | `three`, `@react-three/fiber`, `@react-three/drei` |
| Physics | `@dimforge/rapier2d-compat` / `rapier3d-compat`, `matter-js` |
| Charts | `recharts` (installed, via `components/ui/chart.tsx`), plain SVG for sparklines |
| Maps | `maplibre-gl` |
| Text layout / typography effects | `@chenglou/pretext` |
| Audio / synths | Web Audio API, `tone` |
| AI | `@anthropic-ai/sdk`, server-side only |
| Generated UI from JSON | `json-render` or similar |
| Browser automation | `playwright` (installed: thumbnails, visual checks, demo videos) |
| Native app wrapper | Capacitor, if a prototype graduates to the App Store |

---

## 6. Lessons learned

Add to this list whenever something breaks and gets fixed. Newest last.

- shadcn's CLI needs `ui.shadcn.com`; in cloud sessions that host must be on the
  environment's network allowlist.
- `Button` rendered via another component's `asChild` trigger (DrawerTrigger,
  DialogTrigger…) gets that component's `data-slot`, so the global 44px touch rule misses
  it. Give such buttons an explicit `size-11`.
- Static pages are prerendered: thumbnails and og files only show up in a build made
  **after** they exist. The capture scripts build first, then capture, so run
  `npm run build` again if you want to see them locally.
- Next resolves `og:image` against `metadataBase` but not `og:video`; `/p/[slug]` builds the
  absolute video URL itself.
- eslint's `react-hooks/set-state-in-effect` is on. Read browser state with
  `useSyncExternalStore` (see `hooks/use-mobile.ts`, `use-reduced-motion.ts`) instead of
  `useEffect` + `setState`.
- A light canvas with alpha-faded trails never fully returns to the background color
  (8-bit rounding leaves faint ghosts). Acceptable for the example; for crisp results
  periodically repaint the full background or use a dark-on-light additive approach.
