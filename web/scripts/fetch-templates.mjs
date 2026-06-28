#!/usr/bin/env node
// fetch-templates.mjs — vendor the bold templates so the gallery can live-render them.
//
// Downloads each template's self-contained template.html from the upstream
// beautiful-html-templates repo (pinned commit) into public/templates/<slug>.html,
// and writes the metadata index to public/data/templates.json.
//
// These files are gitignored (upstream MIT content) — run after install:
//   npm run fetch
//
// Pin matches REFERENCES.md. Override with TEMPLATES_REF=<sha|branch> to re-vendor
// a newer snapshot (then bump REFERENCES.md).

import { mkdir, writeFile, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'zarazhangrui/beautiful-html-templates';
const REF = process.env.TEMPLATES_REF || 'e5e204fb1f3b06290846e7dcd7aceddabeceec8c';
const raw = (p) => `https://raw.githubusercontent.com/${REPO}/${REF}/${p}`;

// Fields the gallery actually uses (keep the shipped index lean).
const FIELDS = ['slug', 'name', 'tagline', 'mood', 'occasion', 'tone',
  'formality', 'density', 'scheme', 'best_for', 'avoid_for', 'slide_count'];

const here = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(here, '..', 'public');
const TPL_DIR = join(PUBLIC, 'templates');
const DATA_DIR = join(PUBLIC, 'data');

async function getText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.text();
}

// The templates are now OWNED and committed (we polish them in place). This
// importer re-pulls the pristine upstream copies and OVERWRITES local edits, so
// it refuses to run unless you pass --force.
if (existsSync(TPL_DIR) && (await readdir(TPL_DIR)).some((f) => f.endsWith('.html')) && !process.argv.includes('--force')) {
  console.error('Refusing to overwrite owned templates in public/templates/.');
  console.error('These are committed and polished in place. To re-import pristine upstream copies');
  console.error('(discarding local edits), run:  node scripts/fetch-templates.mjs --force');
  process.exit(2);
}

const index = JSON.parse(await getText(raw('index.json')));
const list = Array.isArray(index) ? index : index.templates;
console.log(`Importing ${list.length} templates from ${REPO}@${REF.slice(0, 7)} …`);

await rm(TPL_DIR, { recursive: true, force: true });
await mkdir(TPL_DIR, { recursive: true });
await mkdir(DATA_DIR, { recursive: true });

// Several templates load deck-stage.js via a relative <script src="deck-stage.js">.
// Upstream keeps it in /runtime; since we flatten templates into one folder, a
// single copy here satisfies every template's relative reference.
await writeFile(join(TPL_DIR, 'deck-stage.js'), await getText(raw('runtime/deck-stage.js')));
console.log('  ✓ deck-stage.js (shared runtime)');

const meta = [];
let ok = 0;
for (const t of list) {
  try {
    const html = await getText(raw(`templates/${t.slug}/template.html`));
    await writeFile(join(TPL_DIR, `${t.slug}.html`), html);
    const row = {};
    for (const f of FIELDS) if (f in t) row[f] = t[f];
    meta.push(row);
    ok++;
    process.stdout.write(`  ✓ ${t.slug}\n`);
  } catch (e) {
    console.error(`  ✗ ${t.slug}: ${e.message}`);
  }
}

await writeFile(
  join(DATA_DIR, 'templates.json'),
  JSON.stringify({ source: `${REPO}@${REF}`, fetched_count: ok, templates: meta }, null, 2),
);
console.log(`Done: ${ok}/${list.length} → public/templates/*.html, metadata → public/data/templates.json`);
if (ok === 0) process.exit(1);
