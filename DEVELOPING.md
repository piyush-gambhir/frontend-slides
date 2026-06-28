# Developing Frontend Slides

This repo is the **shared core** for an AI-driven slide generator. Today it ships
as a Claude Code skill; a CLI and a web app are planned, and all three reuse the
same core (design rules, templates, and the fixed-stage CSS).

## Source of truth

The skill content lives **once**, at the repository root:

```
SKILL.md                 # the workflow the agent follows
STYLE_PRESETS.md         # 12 safe visual presets
viewport-base.css        # mandatory fixed 16:9 stage CSS (copied into every deck)
html-template.md         # HTML/JS architecture reference
animation-patterns.md    # animation reference
bold-template-pack/      # 34 bold design systems (index + per-template cards/specs)
scripts/                 # extract-pptx.py, deploy.sh, export-pdf.sh
```

The Claude Code **plugin** at `plugins/frontend-slides/skills/frontend-slides/`
is a **generated mirror** of those files — it exists only because the plugin
marketplace install reads from that path. Do not hand-edit it.

> Earlier this mirror was a hand-maintained byte-for-byte duplicate with no
> sync, which is how the two copies could silently drift. `sync.sh` replaces that.

## Workflow

1. Edit skill files at the **root** only.
2. Regenerate the mirror:
   ```bash
   bash sync.sh
   ```
3. Commit. CI (`.github/workflows/sync-check.yml`) runs `bash sync.sh --check`
   and fails the build if the mirror is out of date, so drift can't land.

To wire the same guard locally as a pre-commit hook:

```bash
printf '#!/usr/bin/env bash\nexec bash sync.sh --check\n' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Roadmap (shared core, three surfaces)

```
                 shared core (this repo's root)
                          │
        ┌─────────────────┼─────────────────┐
   Agent skill          CLI tool          Web app
   (Claude Code)      slidegen "..."    (Claude API)
     [shipped]           [planned]      [started: web/]
```

The CLI and web app live as sibling directories that read the same core, so
quality improvements to the core benefit all three. Keep new core logic in the
root files, not in a surface.

- **`web/`** — Vite + React template gallery (first web screen): live
  first-slide thumbnails of every bold template, with filter/search. See
  [web/README.md](web/README.md). It vendors template HTML from upstream via
  `npm run fetch` (gitignored).

## Upstream

Forked from [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides)
(MIT). The original is wired up as the `upstream` git remote for reference and
selective syncing:

```bash
git fetch upstream && git merge upstream/main
```

All reference repos we build on (this one plus
[beautiful-html-templates](https://github.com/zarazhangrui/beautiful-html-templates),
the source of `bold-template-pack/`) are tracked in [REFERENCES.md](REFERENCES.md)
— including the commit each was at on our last review, so re-checks only cover new
changes. Update that file's dates/SHAs whenever you re-analyze an upstream.
