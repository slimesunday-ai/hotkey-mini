// Determinism (SPEC §14): the same seed gives the same feed, byte for byte; different seeds differ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runSeason } from '../src/season.mjs';
import { defaultConfig } from '../src/config.mjs';
import { loadLineup } from '../src/lineups.mjs';
import { main } from '../src/cli.mjs';
import { tempDir } from './helpers.mjs';

const feedText = r => r.feed.map(l => JSON.stringify(l)).join('\n');

test('same seed, same feed; different seeds differ', async () => {
  const a = await runSeason({ seed: 7, config: defaultConfig(), lineup: loadLineup('default') });
  const b = await runSeason({ seed: 7, config: defaultConfig(), lineup: loadLineup('default') });
  const c = await runSeason({ seed: 8, config: defaultConfig(), lineup: loadLineup('default') });
  assert.equal(a.feed.length, 54);
  assert.equal(feedText(a), feedText(b));
  assert.notEqual(feedText(a), feedText(c));
});

test('run.mjs writes byte-identical feed.jsonl files for the same seeds', async () => {
  const t1 = tempDir();
  const t2 = tempDir();
  try {
    await main(['--bots', '--seeds', '2', '--start', '3', '--out', path.join(t1.dir, 'r')], { log: () => {} });
    await main(['--bots', '--seeds', '2', '--start', '3', '--out', path.join(t2.dir, 'r')], { log: () => {} });
    for (const seed of ['3', '4']) {
      const x = fs.readFileSync(path.join(t1.dir, 'r', seed, 'feed.jsonl'));
      const y = fs.readFileSync(path.join(t2.dir, 'r', seed, 'feed.jsonl'));
      assert.ok(x.length > 1000);
      assert.ok(x.equals(y), `seed ${seed} feed differs`);
    }
    const f3 = fs.readFileSync(path.join(t1.dir, 'r', '3', 'feed.jsonl'), 'utf8');
    const f4 = fs.readFileSync(path.join(t1.dir, 'r', '4', 'feed.jsonl'), 'utf8');
    assert.notEqual(f3, f4);
  } finally {
    t1.cleanup();
    t2.cleanup();
  }
});

test('the engine never calls Math.random or Date.now', () => {
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.mjs') && f !== 'cli.mjs')) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.ok(!/Math\.random\s*\(/.test(src), `${f} uses Math.random`);
    assert.ok(!/Date\.now\s*\(/.test(src), `${f} uses Date.now`);
  }
});
