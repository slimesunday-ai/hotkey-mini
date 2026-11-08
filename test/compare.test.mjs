import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../tools/compare.mjs', import.meta.url));
const reportA = {
  meta: { run: 'alpha', lineup: 'default', off: ['rent'], sets: ['x=1'], configHash: 'aaa' },
  seasons: 2,
  interacting: { involvedShare: 0.25, interactionsPerAgentPerDay: 2, messagesSent: 0, promisesMade: 0, tradesAgentAgent: 8 },
  interesting: {
    momentsPerSeason: 3, leadChanges: 1.2345, greedySimilarity: null,
    momentsByType: { shared: 2, onlyA: 1 },
    winsByJob: { dealer: 0.5, chemist: 0.5 },
    winsByBrain: { greedy: 0.5, turtle: 0.5 },
  },
  watch: { minutesWatched: 100, audienceEndRatio: 1.5, seasonsGrowing: 0.2, longestDull: 1.2345 },
  economy: { dealCash: 100, jailShare: 0.1, hospitalShare: 0, cashByDay: [10, 20] },
  marks: [
    { mark: 'Improved', pass: false }, { mark: 'Stable', pass: true },
    { pass: true }, { mark: 'Removed', pass: false }, { mark: 'Applicable', pass: null },
  ],
};
const reportB = {
  meta: { run: 'beta', lineup: 'all-greedy', off: [], sets: [], configHash: 'bbb' },
  seasons: 3,
  interacting: { involvedShare: 0.5, interactionsPerAgentPerDay: 3, messagesSent: 4, promisesMade: 0, tradesAgentAgent: 6, minPartners: 3 },
  interesting: {
    momentsPerSeason: 6, leadChanges: 2.3456, greedySimilarity: 0.75,
    momentsByType: { shared: 4, onlyB: 3 },
    winsByJob: { dealer: 0.75, smuggler: 0.25 },
    winsByBrain: { greedy: 0.75, hustler: 0.25 },
  },
  watch: { minutesWatched: 120, audienceEndRatio: 1.8, seasonsGrowing: 0.3, longestDull: 0.33333 },
  economy: { dealCash: 125, jailShare: 0.05, hospitalShare: 0, cashByDay: [15, 30, 5] },
  marks: [
    { mark: 'Stable', pass: true }, { mark: 'Improved', pass: true },
    { pass: false }, { mark: 'Added', pass: true }, { mark: 'Applicable', pass: true },
  ],
};

function fixtures(t, a = reportA, b = reportB) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hkmini-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const runA = path.join(dir, 'run A'), runB = path.join(dir, 'run B');
  for (const [folder, report] of [[runA, a], [runB, b]]) {
    fs.mkdirSync(folder);
    fs.writeFileSync(path.join(folder, 'report.json'), JSON.stringify(report));
  }
  return { dir, runA, runB };
}

function cli(...args) {
  const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  assert.ifError(result.error);
  return result;
}

function jsonResult(runA, runB) {
  const result = cli(runA, runB, '--json');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.doesNotMatch(result.stdout, /Infinity|NaN/);
  return JSON.parse(result.stdout);
}

function row(data, metric) {
  const result = data.metrics.find(entry => entry.metric === metric);
  assert.ok(result, `Missing metric: ${metric}`);
  return result;
}

function textRow(output, metric) {
  const line = output.split('\n').find(line => line.startsWith(`${metric} `));
  assert.ok(line, `Missing text metric: ${metric}`);
  return line.trim().split(/\s{2,}/);
}

test('--json includes run metadata, numeric metric rows and mark differences', t => {
  const { runA, runB } = fixtures(t);
  const data = jsonResult(runA, runB);
  assert.deepEqual(Object.keys(data), ['runs', 'metrics', 'marks']);
  assert.deepEqual(data.runs, {
    a: { folder: runA, meta: { ...reportA.meta, seasons: 2 } },
    b: { folder: runB, meta: { ...reportB.meta, seasons: 3 } },
  });
  assert.deepEqual(row(data, 'economy.dealCash'), {
    metric: 'economy.dealCash', a: 100, b: 125, delta: 25, percentChange: 25, unit: 'number',
  });
  assert.deepEqual(row(data, 'interacting.involvedShare'), {
    metric: 'interacting.involvedShare', a: 0.25, b: 0.5, delta: 0.25, percentChange: 100, unit: 'share',
  });
  assert.equal(row(data, 'interacting.tradesAgentAgent').delta, -2);
  assert.equal(row(data, 'interacting.tradesAgentAgent').percentChange, -25);
  assert.ok(Math.abs(row(data, 'interesting.leadChanges').delta - 1.1111) < 1e-10);
  assert.ok(Array.isArray(data.marks));
});

test('plain text includes metadata and formats shares, deltas and numbers', t => {
  const { runA, runB } = fixtures(t);
  const result = cli(runA, runB);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  assert.ok(result.stdout.startsWith(`A: ${runA} | run=alpha | lineup=default | off=["rent"] | sets=["x=1"] | configHash=aaa | seasons=2\n`));
  assert.ok(result.stdout.includes(`B: ${runB} | run=beta | lineup=all-greedy | off=[] | sets=[] | configHash=bbb | seasons=3\n`));
  assert.deepEqual(textRow(result.stdout, 'interacting.involvedShare'),
    ['interacting.involvedShare', '25%', '50%', '+25 pp', '+100%']);
  assert.deepEqual(textRow(result.stdout, 'interacting.tradesAgentAgent'),
    ['interacting.tradesAgentAgent', '8', '6', '-2', '-25%']);
  assert.deepEqual(textRow(result.stdout, 'interesting.leadChanges'),
    ['interesting.leadChanges', '1.23', '2.35', '+1.11', '+90%']);
  assert.deepEqual(textRow(result.stdout, 'watch.audienceEndRatio'),
    ['watch.audienceEndRatio', '1.5', '1.8', '+0.3', '+20%']);
  assert.deepEqual(textRow(result.stdout, 'economy.jailShare'),
    ['economy.jailShare', '10%', '5%', '-5 pp', '-50%']);
});

test('strong dull fields compare when present, with shares formatted as percentages', t => {
  const a = { watch: { longestStrongDull: 2, longestStrongDullMax: 4, seasonsStrongDullAtMost3: 0.5 } };
  const b = { watch: { longestStrongDull: 3, longestStrongDullMax: 6, seasonsStrongDullAtMost3: 0.75 } };
  const { runA, runB } = fixtures(t, a, b);
  const data = jsonResult(runA, runB);
  const result = cli(runA, runB);
  assert.equal(result.status, 0, result.stderr);
  for (const [key, left, right, delta, unit, cells] of [
    ['longestStrongDull', 2, 3, 1, 'number', ['2', '3', '+1', '+50%']],
    ['longestStrongDullMax', 4, 6, 2, 'number', ['4', '6', '+2', '+50%']],
    ['seasonsStrongDullAtMost3', 0.5, 0.75, 0.25, 'share', ['50%', '75%', '+25 pp', '+50%']],
  ]) {
    const metric = `watch.${key}`;
    assert.deepEqual(row(data, metric), { metric, a: left, b: right, delta, percentChange: 50, unit });
    assert.deepEqual(textRow(result.stdout, metric), [metric, ...cells]);
  }
  const missing = fixtures(t, {}, b);
  for (const [left, right, side] of [[missing.runA, missing.runB, 'a'], [missing.runB, missing.runA, 'b']]) {
    const partial = jsonResult(left, right);
    for (const key of Object.keys(b.watch)) {
      const metric = row(partial, `watch.${key}`);
      assert.equal(metric[side], null);
      assert.equal(metric.delta, null);
      assert.equal(metric.percentChange, null);
    }
  }
  assert.deepEqual(jsonResult(missing.runA, missing.runA).metrics, []);
});

test('zero bases yield n/a in text and null in JSON, including zero to zero', t => {
  const { runA, runB } = fixtures(t);
  const data = jsonResult(runA, runB);
  const result = cli(runA, runB);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /Infinity|NaN/);
  for (const metric of ['interacting.messagesSent', 'interacting.promisesMade', 'economy.hospitalShare']) {
    assert.equal(row(data, metric).percentChange, null);
    assert.equal(textRow(result.stdout, metric).at(-1), 'n/a');
  }
  assert.equal(row(data, 'interacting.messagesSent').delta, 4);
  assert.equal(row(data, 'interacting.promisesMade').delta, 0);
});

test('union sections include either run\'s keys and days, using zero for missing entries', t => {
  const { runA, runB } = fixtures(t);
  const data = jsonResult(runA, runB);
  for (const [metric, a, b] of [
    ['interesting.momentsByType.onlyA', 1, 0],
    ['interesting.momentsByType.onlyB', 0, 3],
    ['interesting.winsByJob.chemist', 0.5, 0],
    ['interesting.winsByJob.smuggler', 0, 0.25],
    ['interesting.winsByBrain.turtle', 0.5, 0],
    ['interesting.winsByBrain.hustler', 0, 0.25],
    ['economy.cashByDay.day1', 10, 15],
    ['economy.cashByDay.day2', 20, 30],
    ['economy.cashByDay.day3', 0, 5],
  ]) {
    const metricRow = row(data, metric);
    assert.equal(metricRow.a, a, metric);
    assert.equal(metricRow.b, b, metric);
    assert.equal(metricRow.delta, b - a, metric);
    assert.equal(metricRow.percentChange, a === 0 ? null : (b - a) / a * 100, metric);
  }
  assert.equal(row(data, 'interesting.winsByJob.chemist').unit, 'share');
  assert.equal(row(data, 'interesting.winsByBrain.greedy').unit, 'share');
  assert.equal(row(data, 'interesting.momentsByType.shared').delta, 2);
});

test('absent sections are allowed; unavailable scalar values remain n/a', t => {
  const { runA, runB } = fixtures(t, {}, reportB);
  const data = jsonResult(runA, runB);
  assert.deepEqual(row(data, 'interacting.minPartners'), {
    metric: 'interacting.minPartners', a: null, b: 3, delta: null, percentChange: null, unit: 'number',
  });
  assert.equal(row(data, 'interesting.winsByJob.dealer').a, 0);
  assert.equal(row(data, 'interesting.momentsByType.shared').a, 0);
  assert.equal(row(data, 'interesting.winsByBrain.greedy').a, 0);
  assert.equal(row(data, 'economy.cashByDay.day1').a, 0);
  assert.ok(!data.metrics.some(entry => entry.metric === 'interacting.rivalries'));
  const result = cli(runA, runB);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(textRow(result.stdout, 'interacting.minPartners'),
    ['interacting.minPartners', 'n/a', '3', 'n/a', 'n/a']);
});

test('marks match by text despite reordering, fall back to index, and show changes', t => {
  const { runA, runB } = fixtures(t);
  const data = jsonResult(runA, runB);
  assert.deepEqual(data.marks, [
    { text: 'Improved', a: 'fail', b: 'pass', changed: true },
    { text: 'Stable', a: 'pass', b: 'pass', changed: false },
    { text: 'Mark #3', a: 'pass', b: 'fail', changed: true },
    { text: 'Removed', a: 'fail', b: 'missing', changed: true },
    { text: 'Applicable', a: 'n/a', b: 'pass', changed: true },
    { text: 'Added', a: 'missing', b: 'pass', changed: true },
  ]);
  const result = cli(runA, runB);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\nmarks\n/);
  assert.match(result.stdout, /Improved\s+fail\s+pass\s+fail -> pass/);
  assert.match(result.stdout, /Stable\s+pass\s+pass\s+unchanged/);
  assert.match(result.stdout, /Applicable\s+n\/a\s+pass\s+n\/a -> pass/);
});

test('missing run folders exit 2 with a clear path on stderr', t => {
  const { dir, runA, runB } = fixtures(t);
  const missing = path.join(dir, 'missing');
  for (const args of [[missing, runB], [runA, missing, '--json']]) {
    const result = cli(...args);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Run folder is missing/);
    assert.ok(result.stderr.includes(missing));
  }
});

test('missing report.json exits 2 and identifies the missing file', t => {
  const { runA, runB } = fixtures(t);
  fs.unlinkSync(path.join(runB, 'report.json'));
  const result = cli(runA, runB);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /report\.json is missing/);
  assert.ok(result.stderr.includes(path.join(runB, 'report.json')));
});

test('invalid arguments print usage and malformed JSON reports its file', t => {
  const { runA, runB } = fixtures(t);
  for (const args of [[], [runA], [runA, runB, '--unknown'], [runA, runB, '--json', 'extra']]) {
    const result = cli(...args);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Usage: node tools\/compare\.mjs <runA> <runB> \[--json\]/);
  }
  fs.writeFileSync(path.join(runA, 'report.json'), '{bad json');
  const result = cli(runA, runB);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Invalid JSON/);
  assert.ok(result.stderr.includes(path.join(runA, 'report.json')));
});
