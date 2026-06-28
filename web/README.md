# Template Gallery (web)

A browsable gallery of every Frontend Slides bold template, with **live
first-slide thumbnails** — each card renders the real template HTML in an iframe,
not a screenshot. Click a card to open the full deck and navigate it with the
arrow keys. Filter by scheme, formality, mood, or free-text search.

This is the first piece of the planned web surface (see `../DEVELOPING.md`).

## Setup

```bash
npm install
npm run fetch     # vendors template HTML from upstream into public/ (one-time)
npm run dev
```

`npm run fetch` downloads each template's self-contained `template.html` (plus the
shared `deck-stage.js` runtime) from the pinned upstream commit into
`public/templates/`, and writes the metadata index to `public/data/templates.json`.
These files are gitignored (upstream MIT content); the provenance/commit pin lives
in `scripts/fetch-templates.mjs` and `../REFERENCES.md`. Re-vendor a newer snapshot
with `TEMPLATES_REF=<sha|branch> npm run fetch` (then bump `REFERENCES.md`).

## How the live thumbnails work

Each template's `template.html` is fully self-contained (inline CSS/JS, only font
CDNs), so it drops straight into an iframe and renders slide 1 for real. The
deck's own scaling fills the 16:9 box. Some templates load `deck-stage.js` via a
relative path — a single shared copy in `public/templates/` satisfies them all.

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run fetch` | Vendor template HTML + metadata from upstream (run once after install) |
| `npm run dev`   | Start the Vite dev server |
| `npm run build` | Type-check-free production build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Stack

Vite + React + TypeScript, no UI framework. Components: `App` (data + filtering),
`Filters`, `TemplateCard`, `TemplateModal`, `LiveThumbnail` (the iframe).
