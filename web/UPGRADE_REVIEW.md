# Gallery Node upgrade review

Reviewed locally on 2026-10-26 against `origin/main` at `86e7150`.
The upstream security update was reconciled before preparing this change.

## Changes and evidence

- Node 26.12.1 is pinned once in the root `.node-version`; the gallery engine
  requires at least that patch within Node 26. Node typings are 26.6.5.
- Existing npm and `package-lock.json` are retained. All other direct packages
  were already current, including standalone TypeScript 7.0.2 and Vite 8.3.5.
  No TypeScript 6 API compatibility package is needed.
- `npm run typecheck` explicitly invokes the installed compiler. The existing
  plugin mirror check remains intact; gallery CI adds clean installation,
  typecheck and production build on Node 26.12.1.
- Clean `npm ci`, TypeScript 7 check, Vite production build and
  `bash sync.sh --check` pass. There is no configured linter or unit test suite.
- Full and production dependency audits report zero vulnerabilities.
  `npm outdated` reports no direct updates.
- Production browser validation exercises all 34 gallery entries loading,
  search narrowing to one entry, opening its real presentation, arrow-key
  navigation, Escape closing, no-match results, Clear, and scheme filtering.
  The final run allows the existing public Chart.js CDN dependency.
- The importer refuses to overwrite owned templates without `--force` as
  expected. Template files, plugin mirrors and application source are unchanged.

## Release limits and gains

The gallery production artifact is `web/dist`. GitHub Actions only checks the
plugin mirror and gallery; no workflow publishes or deploys. GitHub reports no
deployment history and no local Vercel project link is present. The separate
manual `scripts/deploy.sh` uploads generated HTML decks to Vercel and is unchanged.
An external Git hosting integration has not been confirmed.

Some existing template HTML loads Chart.js or fonts from public CDNs. Blocking
all external requests produces `Chart is not defined` errors in those decks;
the template library has not been made offline. Browser verification samples
one full presentation and gallery controls, not every slide of all 34 decks.
No provider account, real deployment, deck publishing, or PDF export was run.

The demonstrated gains are explicit Node 26 compatibility, matching typings
and a gallery CI gate that catches type failures before bundling. The existing
zero-vulnerability dependency state is preserved. No speedup is claimed because
no comparative performance benchmark was run.
