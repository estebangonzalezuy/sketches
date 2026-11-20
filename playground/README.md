# Playground

Private prototype playground: one Next.js app holding many small, self-contained
prototypes. Rules for building prototypes are in [`../CLAUDE.md`](../CLAUDE.md).

```bash
npm install
npm run dev                      # http://localhost:3000, never a password locally
npm run check                    # lint, typecheck, tests, production build
npm run thumbnails -- <slug>     # or no args for all, --missing for gaps
npm run og -- <slug>             # og image + video, public prototypes only
```

## Deploy (Vercel)

A separate Vercel project from the old sketches site, with **Root Directory** set to
`playground`. Environment variables:

| Name | Value |
| --- | --- |
| `PLAYGROUND_PASSWORD` | optional. Set it (production and preview) to put the site behind a password; leave it out for an open site. Redeploy after changing it. |
| `SITE_URL` | optional, e.g. `https://playground.example.com`, for absolute og URLs |

`vercel.json` skips builds for commits that don't touch `playground/`.
