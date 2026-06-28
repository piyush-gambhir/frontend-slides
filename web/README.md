# Template Gallery (web)

A browsable gallery of every Frontend Slides bold template, with **live
first-slide thumbnails** — each card renders the real template HTML in an iframe,
not a screenshot. Click a card to open the deck as a near-fullscreen slideshow and
navigate it with the arrow keys. Filter by scheme, formality, mood, or free-text
search.

This is the first piece of the planned web surface (see `../DEVELOPING.md`). UI is
built with [shadcn/ui](https://ui.shadcn.com) (Tailwind + Radix); components live
in `src/components/ui/`.

## How thumbnails fit any size

Decks are authored for a full 1920×1080 viewport and don't scale down gracefully
in a tiny iframe — they crop. So `DeckFrame` renders the iframe at its true
1920×1080 size and uniformly shrinks it with `transform: scale(factor)`, where
`factor = containerWidth / 1920` is measured on mount + window resize. (CSS
container units can't drive `scale()` — it needs a unitless number — so this is a
small measured value, not pure CSS.)

## Setup

```bash
npm install
npm run dev
```

The templates are **owned and committed** under `public/templates/` (forked from
upstream `beautiful-html-templates` @ `e5e204f` — see `../REFERENCES.md`). We
polish them in place, so there's nothing to fetch after clone.

`npm run fetch` is now only a deliberate re-import of pristine upstream copies and
**refuses to run without `--force`** (it would overwrite our edits):
`node scripts/fetch-templates.mjs --force`.

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
