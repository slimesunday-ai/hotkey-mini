// The run.mjs side of per-seat models: --seat-models, the ai5 lineup and its twin, the dry run, refusals. Fakes only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { main, parseArgs, parseSeatModels } from '../../src/cli.mjs';
import { loadLineup, withAiSeats } from '../../src/lineups.mjs';
import { tempDir } from './helpers.mjs';

const SEATS5 = [
  { model: 'claude-sonnet-5-5', api: 'claude', effort: 'high' },
  { model: 'claude-sonnet-5-5', api: 'claude', effort: 'high' },
  { model: 'claude-haiku-5-5', api: 'claude', effort: 'xhigh' },
  { model: 'openai/gpt-6.1-sol', api: 'openrouter' },
  { model: 'moonshotai/kimi-k3.1-pro', api: 'openrouter' },
];
const SM = JSON.stringify(SEATS5);
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));

test('--seat-models parsing', () => {
  assert.deepEqual(parseSeatModels(SM), SEATS5);
  assert.deepEqual(parseArgs(['--ai', '--fake', '--seat-models', SM]).seatModels, SEATS5);
  const bad = [
    ['not json', /not JSON/],
    ['{}', /JSON array/],
    ['[]', /at least one seat/],
    ['[1]', /\[0\] is not an object/],
    ['[{"model":"x"}]', /needs an api: openrouter or claude/],
    ['[{"model":"x","api":"anthropic"}]', /needs an api/],
    ['[{"api":"claude"}]', /needs a model/],
    ['[{"model":"openai/gpt-6.1-sol","api":"openrouter","effort":"high"}]', /effort is for claude seats only/],
    ['[{"model":"claude-sonnet-5-5","api":"claude","effort":"extra"}]', /effort is one of low, medium, high, xhigh, max/],
    ['[{"model":"claude-sonnet-9","api":"claude"}]', /has no Claude price/],
    ['[{"model":"claude-sonnet-5-5","api":"claude","efort":"high"}]', /unknown keys: efort/],
  ];
  for (const [text, why] of bad) assert.throws(() => parseSeatModels(text), why, text);
  assert.throws(() => parseArgs(['--ai', '--fake', '--models', 'a/b', '--seat-models', SM]), /replaces --models/);
  assert.throws(() => parseArgs(['--bots', '--seat-models', SM]), /for --ai runs/);
});

test('the real path refuses without --max-cost or --go, with --seat-models too', () => {
  assert.throws(() => parseArgs(['--ai', '--seat-models', SM, '--seeds', '1']), /max-cost/);
  assert.throws(() => parseArgs(['--ai', '--seat-models', SM, '--seeds', '1', '--max-cost', '3']), /--go/);
  assert.throws(() => parseArgs(['--ai', '--seat-models', SM, '--seeds', '1', '--go', 'yes']), /max-cost/);
  assert.throws(() => parseArgs(['--ai', '--dry-run', '--seat-models', SM, '--go', 'yes']), /max-cost/);
  assert.doesNotThrow(() => parseArgs(['--ai', '--seat-models', SM, '--seeds', '1', '--max-cost', '3', '--go', 'yes']));
  assert.doesNotThrow(() => parseArgs(['--ai', '--fake', '--seat-models', SM]));
});

test('the ai5 lineup: five characters, five greedy seats, no turtle; seat-models take the greedy seats in order', () => {
  const ai5 = loadLineup('ai5');
  assert.deepEqual(ai5.seats.map(s => s.brain), ['hothead', 'hustler', 'showboat', 'snake', 'saint', 'greedy', 'greedy', 'greedy', 'greedy', 'greedy']);
  const lineup = withAiSeats(ai5, SEATS5);
  assert.deepEqual(lineup.seats.slice(0, 5), ai5.seats.slice(0, 5));
  assert.deepEqual(lineup.seats.slice(5), SEATS5.map(m => ({ brain: 'ai', twinBrain: 'greedy', model: m.model, api: m.api, ...(m.effort ? { effort: m.effort } : {}) })));
  // The lineup itself is untouched, so the twin replays it with greedy in those seats.
  assert.deepEqual(loadLineup('ai5'), ai5);
  assert.throws(() => withAiSeats(ai5, [...SEATS5, SEATS5[0]]), /5 greedy seats for the AI to take, and 6 models/);
  assert.throws(() => withAiSeats(loadLineup('default'), SEATS5), /4 greedy seats/);
  // Plain model ids still make OpenRouter seats.
  assert.deepEqual(withAiSeats(loadLineup('default'), ['x/y']).seats[6], { brain: 'ai', twinBrain: 'greedy', model: 'x/y' });
});

test('a fake ai5 season with 5 seat-models: both APIs play, run.json records them, and the twin plays greedy', async () => {
  const t = tempDir();
  try {
    const out = path.join(t.dir, 'ai5');
    const { runJson, report } = await main(['--ai', '--fake', '--seeds', '1', '--lineup', 'ai5', '--seat-models', SM, '--out', out, '--quiet']);
    assert.equal(runJson.transport, 'fake');
    assert.deepEqual(runJson.seatModels, SEATS5);
    assert.deepEqual(runJson.apis, ['claude', 'openrouter']);
    assert.equal(runJson.go, null);
    assert.deepEqual(runJson.aiSeats.map(s => [s.agentId, s.model, s.api, s.effort]), [
      ['a06', 'claude-sonnet-5-5', 'claude', 'high'], ['a07', 'claude-sonnet-5-5', 'claude', 'high'], ['a08', 'claude-haiku-5-5', 'claude', 'xhigh'],
      ['a09', 'openai/gpt-6.1-sol', 'openrouter', null], ['a10', 'moonshotai/kimi-k3.1-pro', 'openrouter', null],
    ]);
    const saved = readJson(path.join(out, 'run.json'));
    assert.deepEqual(saved.ai.seatModels, SEATS5);
    assert.deepEqual(saved.ai.stops, []);
    assert.equal(saved.ai.capped, false);
    assert.equal(saved.ai.halted, null);
    const pm = saved.ai.perModel;
    assert.deepEqual(Object.keys(pm).sort(), ['claude-haiku-5-5', 'claude-sonnet-5-5', 'moonshotai/kimi-k3.1-pro', 'openai/gpt-6.1-sol']);
    assert.equal(pm['claude-sonnet-5-5'].calls, 2 * 54);
    assert.equal(pm['claude-haiku-5-5'].calls, 54);
    assert.equal(pm['openai/gpt-6.1-sol'].calls, 54);
    for (const v of Object.values(pm)) assert.equal(v.failed, 0);
    assert.ok(pm['claude-sonnet-5-5'].reasoning > 0);
    const feed = fs.readFileSync(path.join(out, '1', 'feed.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
    // One call per AI turn (no failures, so no retries); a dead seat's hours get no call, so this isn't always 5 x 54.
    assert.equal(saved.ai.spend.calls, feed.flatMap(l => l.agents.filter(e => e.by === 'ai')).length);
    assert.equal(saved.ai.spend.calls, Object.values(pm).reduce((s, v) => s + v.calls, 0));
    const byAi = feed.flatMap(l => l.agents.filter(e => e.by === 'ai').map(e => e.id));
    assert.deepEqual([...new Set(byAi)].sort(), ['a06', 'a07', 'a08', 'a09', 'a10']);
    const main1 = readJson(path.join(out, '1', 'season.json')).setup.agents;
    const twin1 = readJson(path.join(out, '1-twin', 'season.json')).setup.agents;
    assert.deepEqual(main1.slice(5).map(a => [a.brain, a.model]), SEATS5.map(m => ['ai', m.model]));
    assert.deepEqual(twin1.map(a => a.brain), ['hothead', 'hustler', 'showboat', 'snake', 'saint', 'greedy', 'greedy', 'greedy', 'greedy', 'greedy']);
    assert.equal(report.ai.compare.length, 5);
  } finally {
    t.cleanup();
  }
});

test('the dry run: one acting hour, then per-turn and per-model numbers and a season estimate', async () => {
  const t = tempDir();
  try {
    const lines = [];
    const out = path.join(t.dir, 'dry');
    const { runJson } = await main(['--ai', '--fake', '--dry-run', '--seeds', '1', '--lineup', 'ai5', '--seat-models', SM, '--out', out], { log: l => lines.push(l) });
    const d = runJson.dryRun;
    assert.equal(runJson.mode, 'ai-fake-dry-run');
    assert.equal(d.hours, 1);
    assert.equal(d.callsPerSeat, 54);
    assert.equal(d.turns.length, 5);
    for (const tr of d.turns) {
      assert.deepEqual(Object.keys(tr).sort(), ['agentId', 'api', 'effort', 'fallback', 'finish', 'model', 'ms', 'ok', 'parsed', 't', 'tries', 'usage', 'why'].sort());
      assert.equal(tr.fallback, null);
      assert.deepEqual(Object.keys(tr.usage).sort(), ['cost', 'in', 'out', 'reasoning']);
      assert.equal(tr.ok, true, tr.why);
      assert.equal(tr.parsed, true);
      assert.equal(tr.t, 0);
    }
    for (const v of Object.values(d.perModel)) {
      for (const k of ['calls', 'in', 'out', 'reasoning', 'cost', 'failed', 'cutoffs', 'fallbacks', 'rescued', 'finishes', 'medianMs', 'p90Ms']) assert.ok(k in v, k);
    }
    assert.equal(typeof d.estimate.total, 'number');
    assert.equal(d.estimateSeason, d.estimate.total);
    assert.deepEqual(Object.keys(d.estimate.perModel).sort(), Object.keys(d.perModel).sort());
    assert.equal(d.estimate.perModel['claude-sonnet-5-5'].seats, 2);
    // It stops after the hour: no season folders, and run.json holds the record.
    assert.ok(!fs.existsSync(path.join(out, '1')));
    assert.deepEqual(readJson(path.join(out, 'run.json')).dryRun.turns.length, 5);
    assert.match(lines[0], /^dry run \(fake: nothing billed.*\): 5 calls, \$\d+\.\d{4}$/);
    assert.equal(lines.filter(l => /^ {2}a\d\d /.test(l)).length, 5);
    assert.match(lines.find(l => l.startsWith('  a06 ')), /^ {2}a06 claude-sonnet-5-5 \(claude, high\): ok \| parsed yes \| finish stop \| in \d+ out \d+ reasoning 500 \| \$\d+\.\d{4} \| \d+\.\d s$/);
    assert.ok(lines.includes('per model:'));
    assert.match(lines.find(l => l.startsWith('  claude-haiku-5-5 ')), /\(claude, xhigh; 1 seat\): 1 calls \| .* cut-offs 0 \| fallbacks 0 \(rescued 0\) \| .* median .* p90 .* \| season \$/);
    assert.match(lines.find(l => l.startsWith('season estimate:')), /^season estimate: \$\d+\.\d{4} \(54 calls per seat × each model's measured cost per call, 5 AI seats\)$/);
    assert.equal(lines.at(-1), 'halted: no');
  } finally {
    t.cleanup();
  }
});

test('a cap mid-season hands the AI seats to greedy, and the run says so (fake-priced cap)', async () => {
  const t = tempDir();
  try {
    const lines = [];
    const out = path.join(t.dir, 'capped');
    const { runJson } = await main(['--ai', '--fake', '--seeds', '1', '--lineup', 'ai5', '--seat-models', SM, '--max-cost', '0.1', '--out', out], { log: l => lines.push(l) });
    const ai = runJson.ai;
    assert.equal(ai.capped, true);
    assert.equal(ai.halted.kind, 'cap');
    assert.equal(ai.stops.length, 1);
    const stop = ai.stops[0];
    assert.equal(stop.seed, 1);
    assert.equal(stop.kind, 'cap');
    assert.ok(stop.greedyFromT > 0 && stop.greedyFromT < 54, String(stop.greedyFromT));
    assert.ok(lines.some(l => l.startsWith(`seed 1: AI capped: `) && l.endsWith(`greedy played the AI seats from t=${stop.greedyFromT}`)));
    const feed = fs.readFileSync(path.join(out, '1', 'feed.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
    assert.ok(feed.slice(stop.greedyFromT).every(l => l.agents.filter(e => ['a06', 'a07', 'a08', 'a09', 'a10'].includes(e.id)).every(e => e.by !== 'ai')));
    assert.ok(feed[stop.greedyFromT].agents.some(e => e.by === 'bot-halted'));
    assert.ok(ai.spend.cost >= 0.1);
  } finally {
    t.cleanup();
  }
});
