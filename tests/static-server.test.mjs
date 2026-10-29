import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

function get(port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, headers }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    req.end();
  });
}

for (const script of [
  '../scripts/check-slides.mjs',
  '../plugins/frontend-slides/skills/frontend-slides/scripts/check-slides.mjs',
]) {
  test(script, async (t) => {
    const { serve } = await import(script);
    const fixture = await mkdtemp(join(tmpdir(), 'slides-http-test-'));
    const deck = join(fixture, 'deck');
    await mkdir(deck);
    await mkdir(join(fixture, 'deck-other'));
    await writeFile(join(deck, 'index.html'), '<h1>Slides</h1>');
    await writeFile(join(deck, 'my style.css'), 'body { color: black; }');
    await writeFile(join(fixture, 'secret.txt'), 'outside-secret');
    await writeFile(join(fixture, 'deck-other', 'secret.txt'), 'outside-secret');
    await symlink(join(fixture, 'secret.txt'), join(deck, 'linked.txt'));
    const { server, port } = await serve(deck, 'index.html');
    t.after(async () => {
      await new Promise((resolve) => server.close(resolve));
      await rm(fixture, { recursive: true, force: true });
    });

    await t.test('serves deck assets and encoded names', async () => {
      assert.deepEqual(await get(port, '/'), { status: 200, body: '<h1>Slides</h1>' });
      assert.deepEqual(await get(port, '/my%20style.css?cache=1'), { status: 200, body: 'body { color: black; }' });
    });
    await t.test('binds only to IPv4 loopback', () => {
      assert.equal(server.address().address, '127.0.0.1');
    });
    await t.test('rejects raw and encoded traversal and sibling prefixes', async () => {
      for (const path of ['/../secret.txt', '/%2e%2e/secret.txt', '/..%2fsecret.txt', '/../deck-other/secret.txt']) {
        const response = await get(port, path);
        assert.equal(response.status, 403, path);
        assert.ok(!response.body.includes('outside-secret'));
      }
    });
    await t.test('rejects symlinks escaping the deck', async () => {
      assert.equal((await get(port, '/linked.txt')).status, 403);
    });
    await t.test('rejects non-loopback Host headers', async () => {
      assert.equal((await get(port, '/', { Host: 'attacker.invalid' })).status, 403);
    });
    await t.test('keeps missing assets as 404', async () => {
      assert.equal((await get(port, '/missing.css')).status, 404);
    });
    await t.test('rejects invalid URL encoding without stopping the server', async () => {
      assert.equal((await get(port, '/%zz')).status, 400);
      assert.equal((await get(port, '/')).status, 200);
    });
  });
}
