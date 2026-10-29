import assert from 'node:assert/strict';
import { copyFile, mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

for (const slug of ['valid-template_1', '../escaped']) {
  test(`template filename: ${slug}`, async (t) => {
    const fixture = await mkdtemp(join(tmpdir(), 'slides-import-test-'));
    t.after(() => rm(fixture, { recursive: true, force: true }));
    await mkdir(join(fixture, 'scripts'));
    const script = join(fixture, 'scripts', 'fetch-templates.mjs');
    await copyFile(new URL('../web/scripts/fetch-templates.mjs', import.meta.url), script);
    const harness = `
      globalThis.fetch = async (url) => new Response(url.endsWith('/index.json')
        ? JSON.stringify([{ slug: ${JSON.stringify(slug)}, name: 'Fixture' }])
        : '<h1>Fixture</h1>');
      await import(${JSON.stringify(pathToFileURL(script).href)});
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', harness], {
      cwd: fixture, encoding: 'utf8', env: { PATH: process.env.PATH },
    });
    if (slug.startsWith('..')) {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /invalid filename slug/);
      await assert.rejects(readFile(join(fixture, 'public', 'escaped.html')), { code: 'ENOENT' });
    } else {
      assert.equal(result.status, 0, result.stderr);
      assert.equal(await readFile(join(fixture, 'public', 'templates', `${slug}.html`), 'utf8'), '<h1>Fixture</h1>');
    }
  });
}
