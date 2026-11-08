// run.mjs end to end (SPEC §10-§12): outputs, report sections, the AI path against the fake model, and the refusals.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { main, parseArgs } from '../src/cli.mjs';
import { tempDir } from './helpers.mjs';

const quiet = { log: () => {} };

test('a bot run writes run.json, report.md/json and per-seed feed, season and play-by-play files', async () => {
  const t = tempDir();
  try {
    const out = path.join(t.dir, 'r');
    const { report } = await main(['--bots', '--seeds', '2', '--set', 'actions.shift.pays=20', '--off', 'crate', '--out', out], quiet);
    for (const f of ['run.json', 'report.md', 'report.json', '1/feed.jsonl', '1/play-by-play.md', '1/season.json', '2/feed.jsonl', '2/play-by-play.md']) assert.ok(fs.existsSync(path.join(out, f)), f);
    const run = JSON.parse(fs.readFileSync(path.join(out, 'run.json'), 'utf8'));
    assert.deepEqual(run.seeds, [1, 2]);
    assert.equal(run.systems.crate, false);
    assert.ok(run.configHash && run.command.includes('--bots'));
    const md = fs.readFileSync(path.join(out, 'report.md'), 'utf8');
    for (const h of ['## Marks', '## 1. Are they interacting?', '## 2. Is anything interesting happening?', '## 3. Would people watch?', '## Economy health']) assert.ok(md.includes(h), h);
    for (const s of ['Interactions per agent per day', 'Unique pairs', 'Rivalries', 'Alliances', 'Messages sent / answered', 'Promises made / kept / broken', 'Board trades', 'Moments by type', 'Lead changes', 'Top-third repeat', 'Turtle', 'Wins by job', 'Wins by character type', 'Action mix', 'Copycat', 'Minutes watched', 'Audience curve', 'Viewer-hours per agent', 'Longest dull stretch', 'Play-by-plays', 'Chain flow', 'cash at the end of each day', 'evictions', 'Gear bought', 'Board prices']) assert.ok(md.includes(s), s);
    assert.equal(report.seasons, 2);
    const feed = fs.readFileSync(path.join(out, '1', 'feed.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
    assert.equal(feed.length, 54);
    const line = feed[10];
    for (const k of ['seed', 'day', 'hour', 'agents', 'events', 'moments', 'audience', 'cops', 'crate', 'king']) assert.ok(k in line, k);
    for (const k of ['id', 'block', 'move', 'target', 'args', 'ok', 'failed', 'why', 'result', 'meters', 'state', 'thought', 'say', 'message', 'viewHash']) assert.ok(k in line.agents[0], k);
    for (const k of ['energy', 'cash', 'stars', 'viewers', 'byGroup']) assert.ok(k in line.agents[0].meters, k);
    const pbp = fs.readFileSync(path.join(out, '1', 'play-by-play.md'), 'utf8');
    assert.ok(pbp.includes('thinks: "'));
    assert.ok(/Day 1 \d\d:00 · /.test(pbp));
  } finally {
    t.cleanup();
  }
});

test('--ai --fake runs a full season through createAiSeats, plus its bot twin', async () => {
  const t = tempDir();
  try {
    const out = path.join(t.dir, 'ai');
    const { report } = await main(['--ai', '--fake', '--seeds', '1', '--out', out], quiet);
    const feed = fs.readFileSync(path.join(out, '1', 'feed.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
    assert.equal(feed.length, 54);
    const aiEntries = feed.flatMap(l => l.agents.filter(e => e.by === 'ai'));
    assert.ok(aiEntries.length >= 54 * 4 - 40, `${aiEntries.length} AI turns`);
    assert.ok(fs.existsSync(path.join(out, '1-twin', 'feed.jsonl')));
    assert.equal(report.ai.spend.cost, 0);
    assert.equal(report.ai.compare.length, 4);
    const md = fs.readFileSync(path.join(out, 'report.md'), 'utf8');
    assert.ok(md.includes('## AI runs'));
    assert.ok(md.includes('bot-twin'));
    const pbp = fs.readFileSync(path.join(out, '1', 'play-by-play.md'), 'utf8');
    assert.ok(/gemini-3\.8-flash|gpt-6\.1-sol|kimi-k3\.1-pro|claude-haiku-5\.5/.test(pbp));
  } finally {
    t.cleanup();
  }
});

test('--ai without --fake refuses to start without both --max-cost and --go', () => {
  assert.throws(() => parseArgs(['--ai', '--seeds', '1']), /max-cost/);
  assert.throws(() => parseArgs(['--ai', '--seeds', '1', '--max-cost', '3']), /--go/);
  assert.throws(() => parseArgs(['--ai', '--seeds', '1', '--go', 'yes']), /max-cost/);
  assert.doesNotThrow(() => parseArgs(['--ai', '--seeds', '1', '--max-cost', '3', '--go', 'yes']));
  assert.doesNotThrow(() => parseArgs(['--ai', '--fake', '--seeds', '1']));
  assert.throws(() => parseArgs(['--seeds', '1']), /--bots or --ai/);
});

test('a lineup file sets the seats', async () => {
  const t = tempDir();
  try {
    const file = path.join(t.dir, 'lineup.json');
    fs.writeFileSync(file, JSON.stringify({ name: 'pair', seats: [{ brain: 'hothead', job: 'dealer' }, { brain: 'saint', job: 'chemist' }, { brain: 'turtle' }] }));
    const { report } = await main(['--bots', '--seeds', '1', '--lineup', file, '--out', path.join(t.dir, 'o')], quiet);
    assert.equal(report.watch.viewerHoursBySeat.length, 3);
    const season = JSON.parse(fs.readFileSync(path.join(t.dir, 'o', '1', 'season.json'), 'utf8'));
    assert.deepEqual(season.setup.agents.map(a => [a.brain, a.job]).slice(0, 2), [['hothead', 'dealer'], ['saint', 'chemist']]);
  } finally {
    t.cleanup();
  }
});
