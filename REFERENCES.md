# Reference Repositories

Upstream projects this repo is built on or borrows from. We periodically re-check
them for changes worth porting here. Each entry records the **last time we
analyzed it** and the **commit it was at then**, so the next review only has to
look at what changed since — not the whole repo again.

> **When you re-analyze:** update that repo's `Last analyzed` date and
> `HEAD at last analysis` SHA below, and jot any findings under its notes.

## Summary

| Repo | Role | Last analyzed | HEAD at last analysis | Default branch |
| ---- | ---- | ------------- | --------------------- | -------------- |
| [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) | Direct upstream — this repo is a fork of it (also the `upstream` git remote) | **2026-06-29** | `9906a34` (2026-06-23) | `main` |
| [zarazhangrui/beautiful-html-templates](https://github.com/zarazhangrui/beautiful-html-templates) | Source of our `bold-template-pack/` (the 34 bold templates) | **2026-06-29** | `e5e204f` (2026-06-09) | `main` |

## How to review new changes since last analysis

For each repo, compare the recorded SHA against the current default branch — this
lists only the commits added since we last looked:

```bash
# frontend-slides (our direct upstream)
gh api repos/zarazhangrui/frontend-slides/compare/9906a34...main \
  --jq '.commits[] | "\(.sha[0:7])  \(.commit.message | split("\n")[0])"'

# beautiful-html-templates (template source)
gh api repos/zarazhangrui/beautiful-html-templates/compare/e5e204f...main \
  --jq '.commits[] | "\(.sha[0:7])  \(.commit.message | split("\n")[0])"'
```

If there are new commits, decide what (if anything) to port, then bump the SHA +
`Last analyzed` date in the table above. `frontend-slides` changes can often be
pulled directly with `git fetch upstream && git merge upstream/main`;
`beautiful-html-templates` changes have to be adapted into our compact pack
format (see notes).

---

## zarazhangrui/frontend-slides

- **Role:** direct upstream. We forked it with fresh history; it is wired up as
  the `upstream` git remote. See `DEVELOPING.md`.
- **License:** MIT.
- **Last analyzed:** 2026-06-29 · **HEAD then:** `9906a34d640d2111f724544cbc50f7f130569ae1` (2026-06-23)
- **Pull updates:** `git fetch upstream && git merge upstream/main`.
- **Notes (2026-06-29):** we imported at `9906a34` (the then-current HEAD), so we
  are even with upstream. Our local divergence so far: single-source-of-truth
  de-dup (`sync.sh`), the visual-QA checker (`scripts/check-slides.*`), and these
  meta docs.

## zarazhangrui/beautiful-html-templates

- **Role:** the library our `bold-template-pack/` is derived from (the 34 bold
  design systems). frontend-slides transforms it into a compact, context-cheap
  form rather than vendoring it whole.
- **License:** MIT.
- **Last analyzed:** 2026-06-29 · **HEAD then:** `e5e204fb1f3b06290846e7dcd7aceddabeceec8c` (2026-06-09)
- **What we vendored vs. what's upstream:**
  - Upstream each `templates/<slug>/` has `design.md` + `template.html` + `template.json`.
  - Our pack each has `design.md` + `preview.md`; the pack root also has
    `selection-index.json` + `deck-stage.js`. The full `template.html`
    implementations and per-template `template.json` were intentionally **not**
    vendored (size / context cost). Upstream is the place to look if we ever need
    a template's full HTML implementation.
  - `runtime/deck-stage.js` upstream is **byte-identical** to our
    `bold-template-pack/deck-stage.js`.
- **Potentially worth porting later (not done yet):**
  - `scripts/new-template.mjs` — scaffolds a new template folder.
  - `scripts/build-index.mjs` — regenerates the index from per-template metadata.
  - `AGENTS.md` — the library's standalone agent workflow.
  These are **reference patterns**, not drop-in: they target upstream's format,
  not our `design.md`/`preview.md`/`selection-index.json` pack format. When we
  build our own "add a template" tooling (Phase 1), mirror the idea and output
  our format.
- **Vendored into `web/`:** the template gallery (`web/`) renders templates live,
  so it vendors each `template.html` plus the shared `runtime/deck-stage.js` from
  this repo at the pinned SHA via `web/scripts/fetch-templates.mjs` (`npm run
  fetch`). Those files are gitignored; bump the pin there + here together when
  re-vendoring.
- **Notes (2026-06-29):** template set is identical to ours (34, no additions);
  upstream has not changed since before we cloned. Nothing to import right now.
