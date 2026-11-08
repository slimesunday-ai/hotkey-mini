import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiSeats, legalReply, stableHash } from '../../src/seats/ai.mjs';
import { parseReply, checkArgs, targetIds } from '../../src/seats/reply.mjs';
import { render } from '../../src/seats/prompt.mjs';
import { SEAT_DEFAULTS } from '../../src/seats/defaults.mjs';
import { fakeModel, manualClock } from '../../src/seats/fake-model.mjs';
import { loadFixture, fixtureNames, atHour, tempDir, fakeKeyFile, drive } from './helpers.mjs';

const MODELS = SEAT_DEFAULTS.models;
const FAKE_URL = 'http://fake.invalid/v1/chat/completions';
const views = () => fixtureNames().map(loadFixture);
const seatsFor = list => list.map((v, i) => ({ agentId: v.you.id, model: MODELS[i % MODELS.length] }));

// A legal reply for a view: on its menu, a listed target, args inside the spec. Talk-only views need move null.
function assertLegal(view, reply, label) {
  const menu = view.menu || [];
  if (menu.length === 0) return assert.equal(reply.move, null, label);
  const line = menu.find(m => m.id === reply.move);
  assert.ok(line, `${label}: ${reply.move} is on the menu`);
  const ids = targetIds(line.targets);
  if (ids.length) assert.ok(ids.includes(reply.target), `${label}: ${reply.target} is a target of ${line.id}`);
  else assert.equal(reply.target, null, label);
  if (line.args) assert.equal(checkArgs(line.args, reply.args).ok, true, `${label}: args ${JSON.stringify(reply.args)} fit ${JSON.stringify(line.args)}`);
}

// A chat completion body, as OpenRouter returns one.
const completion = (content, { cost = 0.001, finish = 'stop', inT = 1000, outT = 50 } = {}) => ({
  id: 'gen-test', model: 'test-model', choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: finish }],
  usage: { prompt_tokens: inT, completion_tokens: outT, total_tokens: inT + outT, cost },
});
// A fetch that answers from a list, in order, and keeps what it was asked.
function stubFetch(answers) {
  const seen = [];
  const f = async (url, init = {}) => {
    seen.push({ url: String(url), method: init.method ?? 'GET', headers: new Headers(init.headers), body: init.body });
    const a = answers.shift();
    if (!a) throw new Error('stub fetch: no answer left');
    if (a.throws) throw new Error(a.throws);
    return new Response(JSON.stringify(a.body), { status: a.status ?? 200 });
  };
  f.seen = seen;
  return f;
}
const okReply = move => JSON.stringify({ move, target: null, args: null, thought: 'test', say: '', message: null, sell: null, callShot: null });

test('the fake transport plays a legal move for every fixture menu, every hour, for $0', async () => {
  const list = views();
  const seats = createAiSeats({ seats: seatsFor(list), transport: 'fake' });
  let turns = 0;
  for (let day = 1; day <= 3; day++) {
    for (let hour = 6; hour <= 23; hour++) {
      const batch = list.map(v => ({ agentId: v.you.id, view: atHour(v, day, hour) }));
      const out = await seats.decide(batch);
      for (const { agentId, view } of batch) {
        const r = out.get(agentId);
        assert.equal(r.ok, true, `${agentId} d${day} h${hour}: ${r.why}`);
        assertLegal(view, r.reply, `${agentId} d${day} h${hour}`);
        // The raw text is what the fake sent, and it parses to the same reply.
        assert.deepEqual(parseReply(r.raw, view.menu, { self: view.you.id, roster: view.roster }).reply, r.reply);
        turns += 1;
      }
    }
  }
  assert.equal(turns, 54 * list.length);
  assert.deepEqual(seats.spend, { cost: 0, calls: turns });
  assert.equal(seats.capped, false);
  assert.equal(seats.fake.failures.length, 0);
  // Over a season the picks spread across the menu.
  const moves = new Set();
  for (let hour = 6; hour <= 23; hour++) moves.add(legalReply(atHour(loadFixture('armed-gunrunner'), 2, hour)).move);
  assert.ok(moves.size >= 5, `${moves.size} distinct moves over 18 hours`);
  await seats.close();
});

test('legalReply is deterministic and always parses as legal', () => {
  for (const v of views()) {
    for (let hour = 6; hour <= 23; hour++) {
      const view = atHour(v, 1, hour);
      const a = legalReply(view);
      assert.deepEqual(legalReply(structuredClone(view)), a);
      const p = parseReply(JSON.stringify(a), view.menu, { self: view.you.id, roster: view.roster });
      assert.equal(p.ok, true, p.why);
      assert.deepEqual(p.trimmed, []);
      assert.deepEqual(p.dropped, []);
      assertLegal(view, p.reply, `${v.you.id} h${hour}`);
    }
  }
  assert.equal(stableHash('a03|2|14'), stableHash('a03|2|14'));
  assert.notEqual(stableHash('a03|2|14'), stableHash('a03|2|15'));
});

test('request settings: thinking minimal (off for Anthropic), max_tokens 2000, JSON mode, cache mark, usage', async () => {
  const v = loadFixture('free-dealer');
  const seats = createAiSeats({
    seats: MODELS.map((model, i) => ({ agentId: `a0${i + 1}`, model })),
    transport: 'fake',
  });
  await seats.decide(MODELS.map((_, i) => ({ agentId: `a0${i + 1}`, view: v })));
  const { system, user } = render(v);
  const byModel = Object.fromEntries(seats.fake.calls.map(c => [c.request.model, c.request]));
  for (const model of MODELS) {
    const body = byModel[model];
    assert.ok(body, model);
    assert.equal(body.max_tokens, 2000, model);
    assert.deepEqual(body.response_format, { type: 'json_object' }, model);
    assert.deepEqual(body.usage, { include: true }, model);
    assert.deepEqual(body.reasoning, model.startsWith('anthropic/') ? { enabled: false } : { effort: 'minimal' }, model);
    assert.deepEqual(body.messages[1], { role: 'user', content: user }, model);
    const sys = body.messages[0];
    assert.equal(sys.role, 'system');
    if (model.startsWith('google/') || model.startsWith('anthropic/')) {
      assert.deepEqual(sys.content, [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }], model);
    } else assert.equal(sys.content, system, model);
  }
  await seats.close();
});

test('a timeout becomes a failed turn after one retry', async () => {
  const clock = manualClock();
  const v = loadFixture('free-dealer');
  const seats = createAiSeats({
    seats: [{ agentId: 'a03', model: MODELS[0] }], transport: 'fake', clock,
    fake: { script: { a03: [{ fault: 'hang' }, { fault: 'hang' }] } },
  });
  const out = await drive(seats.decide([{ agentId: 'a03', view: v }]), clock, 10000, 100);
  const r = out.get('a03');
  assert.equal(r.ok, false);
  assert.equal(r.why, 'timeout');
  assert.equal(r.reply, null);
  assert.equal(r.tries, 2);
  assert.ok(r.ms >= 2 * SEAT_DEFAULTS.timeoutMs, `${r.ms} ms`);
  assert.deepEqual(seats.fake.calls.map(c => [c.call, c.outcome]), [[1, 'none'], [2, 'none']]);
  assert.equal(seats.perModel[MODELS[0]].failed, 1);
  assert.equal(seats.perModel[MODELS[0]].calls, 2);
  await seats.close();
});

test('a retry after a timeout can still win the turn; a model reply that fails to parse is not retried', async () => {
  const clock = manualClock();
  const v = loadFixture('free-dealer');
  const seats = createAiSeats({
    seats: [{ agentId: 'a03', model: MODELS[1] }, { agentId: 'a04', model: MODELS[1] }, { agentId: 'a05', model: MODELS[1] }],
    transport: 'fake', clock,
    fake: { script: { a03: [{ fault: 'hang' }, { bot: true }], a04: [{ fault: 'malformed' }], a05: [{ fault: 'cutoff' }] } },
  });
  const out = await drive(seats.decide(['a03', 'a04', 'a05'].map(agentId => ({ agentId, view: v }))), clock, 10000, 100);
  assert.equal(out.get('a03').ok, true, out.get('a03').why);
  assert.equal(out.get('a03').tries, 2);
  assert.deepEqual(out.get('a04'), { ...out.get('a04'), ok: false, why: 'no JSON object in the reply', tries: 1, raw: '{ this reply is not JSON }' });
  assert.equal(out.get('a05').ok, false);
  assert.equal(out.get('a05').finish, 'length');
  assert.match(out.get('a05').why, /^cut off: /);
  assert.equal(out.get('a05').tries, 1);
  assert.equal(seats.perModel[MODELS[1]].failed, 2);
  await seats.close();
});

test('arrival order does not change the results', async () => {
  const list = views();
  const ids = list.map(v => v.you.id);
  async function run(delays) {
    const clock = manualClock();
    const script = Object.fromEntries(ids.map((id, i) => [id, [{ bot: true, delayMs: delays[i] }]]));
    const seats = createAiSeats({ seats: seatsFor(list), transport: 'fake', clock, fake: { script } });
    const out = await drive(seats.decide(list.map(v => ({ agentId: v.you.id, view: v }))), clock, 50, 100);
    const finished = [...seats.fake.calls].sort((a, b) => a.start + a.ms - (b.start + b.ms)).map(c => c.seat);
    await seats.close();
    return { out, finished };
  }
  const a = await run([400, 300, 200, 100]);
  const b = await run([100, 200, 300, 400]);
  assert.notDeepEqual(a.finished, b.finished, 'the replies landed in different orders');
  assert.deepEqual([...a.out.keys()], [...ids].sort());
  assert.deepEqual([...b.out.keys()], [...ids].sort());
  for (const id of ids) {
    const { ms: _a, ...ra } = a.out.get(id);
    const { ms: _b, ...rb } = b.out.get(id);
    assert.deepEqual(ra, rb, id);
  }
});

test('calls run in parallel up to the concurrency cap', async () => {
  const v = loadFixture('zero-energy');
  const ids = ['a01', 'a02', 'a03', 'a04'];
  async function starts(concurrency) {
    const clock = manualClock();
    const script = Object.fromEntries(ids.map(id => [id, [{ bot: true, delayMs: 100 }]]));
    const seats = createAiSeats({ seats: ids.map(agentId => ({ agentId, model: MODELS[0] })), transport: 'fake', clock, concurrency, fake: { script } });
    const out = await drive(seats.decide(ids.map(agentId => ({ agentId, view: v }))), clock, 50, 100);
    assert.ok([...out.values()].every(r => r.ok));
    const s = seats.fake.calls.map(c => c.start).sort((x, y) => x - y);
    await seats.close();
    return s;
  }
  assert.deepEqual(await starts(4), [0, 0, 0, 0]);
  assert.deepEqual(await starts(2), [0, 0, 100, 100]);
  assert.deepEqual(await starts(1), [0, 100, 200, 300]);
});

test('the spend cap stops calls (fake transport with costed replies)', async () => {
  const v = loadFixture('free-dealer');
  const usage = { prompt_tokens: 1000, completion_tokens: 60, total_tokens: 1060, cost: 0.006 };
  const script = { a01: [{ json: JSON.parse(okReply('rest')), usage }], a02: [{ json: JSON.parse(okReply('deal')), usage }] };
  const halts = [];
  const seats = createAiSeats({
    seats: [{ agentId: 'a01', model: MODELS[0] }, { agentId: 'a02', model: MODELS[1] }], transport: 'fake', maxCost: 0.01,
    concurrency: 1, fake: { script }, onHalt: h => halts.push(h.kind),
  });
  assert.equal(seats.estimate({ callsPerSeat: 54 }), null);
  const hour1 = await seats.decide([{ agentId: 'a01', view: v }, { agentId: 'a02', view: v }]);
  // The call that crossed the cap was paid for, so its reply stands.
  assert.equal(hour1.get('a01').ok, true);
  assert.equal(hour1.get('a02').ok, true);
  assert.deepEqual(hour1.get('a02').usage, { in: 1000, out: 60, reasoning: null, cost: 0.006 });
  assert.equal(seats.capped, true);
  assert.deepEqual(halts, ['cap']);
  const hour2 = await seats.decide([{ agentId: 'a01', view: v }, { agentId: 'a02', view: v }]);
  for (const r of hour2.values()) {
    assert.equal(r.ok, false);
    assert.equal(r.why, 'capped');
    assert.equal(r.tries, 0);
  }
  assert.equal(seats.fake.calls.length, 2, 'no call after the cap');
  assert.equal(seats.spend.calls, 2);
  assert.ok(Math.abs(seats.spend.cost - 0.012) < 1e-12);
  const pm = seats.perModel[MODELS[0]];
  assert.deepEqual({ calls: pm.calls, in: pm.in, out: pm.out, cost: pm.cost, failed: pm.failed, skipped: pm.skipped }, { calls: 1, in: 1000, out: 60, cost: 0.006, failed: 0, skipped: 1 });
  assert.equal(seats.halted.kind, 'cap');
  assert.ok(Math.abs(seats.estimate({ callsPerSeat: 54 }) - 0.006 * 54 * 2) < 1e-9);
  await seats.close();
});

test('the spend cap stops paid calls through the copied OpenRouter client (fake fetch, temp key)', async () => {
  const { dir, cleanup } = tempDir();
  try {
    const v = loadFixture('free-dealer');
    const usage = { prompt_tokens: 1200, completion_tokens: 80, total_tokens: 1280, cost: 0.006 };
    const fake = fakeModel({ script: { a01: [{ json: JSON.parse(okReply('rest')), usage }], a02: [{ json: JSON.parse(okReply('deal')), usage }] } });
    const seats = createAiSeats({
      seats: [{ agentId: 'a01', model: MODELS[2] }, { agentId: 'a02', model: MODELS[3] }], transport: 'openrouter',
      keyFile: fakeKeyFile(dir), maxCost: 0.01, go: 'test go words', fetch: fake.fetch, url: FAKE_URL, concurrency: 1,
    });
    assert.equal(seats.go, 'test go words');
    const hour1 = await seats.decide([{ agentId: 'a01', view: v }, { agentId: 'a02', view: v }]);
    assert.equal(hour1.get('a01').ok, true, hour1.get('a01').why);
    assert.equal(hour1.get('a02').ok, true, hour1.get('a02').why);
    assert.equal(seats.capped, true);
    const hour2 = await seats.decide([{ agentId: 'a01', view: v }, { agentId: 'a02', view: v }]);
    assert.deepEqual([...hour2.values()].map(r => [r.ok, r.why]), [[false, 'capped'], [false, 'capped']]);
    assert.equal(fake.calls.length, 2, 'no paid call after the cap');
    assert.equal(seats.spend.calls, 2);
    assert.ok(Math.abs(seats.spend.cost - 0.012) < 1e-12);
    assert.equal(seats.perModel[MODELS[3]].cost, 0.006);
    assert.equal(seats.log.length, 2);
    assert.equal(seats.log[0].model, MODELS[2]);
    await fake.close();
  } finally {
    cleanup();
  }
});

test('the real transport refuses to start without maxCost and go, and reads the key file only after both', () => {
  const seats = [{ agentId: 'a01', model: MODELS[0] }];
  const missing = '/nonexistent-hkmini/key';
  const stub = stubFetch([]);
  for (const maxCost of [undefined, 0, -1, Number.NaN, '3']) {
    assert.throws(() => createAiSeats({ seats, transport: 'openrouter', keyFile: missing, go: 'go', maxCost, fetch: stub }), /without maxCost/, String(maxCost));
  }
  for (const go of [undefined, '', '   ', 7]) {
    assert.throws(() => createAiSeats({ seats, transport: 'openrouter', keyFile: missing, go, maxCost: 3, fetch: stub }), /without go/, String(go));
  }
  // With both, the key file is read (and this one doesn't exist).
  assert.throws(() => createAiSeats({ seats, transport: 'openrouter', keyFile: missing, go: 'go', maxCost: 3, fetch: stub }), /ENOENT/);
  // Under node --test the default key file and the real fetch are refused before anything is read.
  assert.throws(() => createAiSeats({ seats, transport: 'openrouter', go: 'go', maxCost: 3, fetch: stub }), /under node --test/);
  const { dir, cleanup } = tempDir();
  try {
    assert.throws(() => createAiSeats({ seats, transport: 'openrouter', keyFile: fakeKeyFile(dir), go: 'go', maxCost: 3 }), /under node --test/);
    assert.throws(() => createAiSeats({ seats, transport: 'openrouter', keyFile: fakeKeyFile(dir), go: 'go', maxCost: 3, fetch: globalThis.fetch }), /under node --test/);
  } finally {
    cleanup();
  }
  assert.equal(stub.seen.length, 0);
  assert.throws(() => createAiSeats({ seats, transport: 'local' }), /transport is 'live' \(or 'openrouter'\) or 'fake'/);
  assert.throws(() => createAiSeats({ seats: [], transport: 'fake' }), /needs seats/);
});

test('openrouter: a 500 gets one retry, a 400 is final, a 402 halts the run; the key rides only in the header', async () => {
  const { dir, cleanup } = tempDir();
  try {
    const v = loadFixture('zero-energy');
    const keyFile = fakeKeyFile(dir);
    const word = ['test', 'only', 'not', 'a', 'key'].join('-');
    const stub = stubFetch([
      { status: 500, body: { error: { code: 500, message: 'upstream' } } },
      { status: 200, body: completion(okReply('rest')) },
      { status: 400, body: { error: { code: 400, message: 'bad field' } } },
      { status: 402, body: { error: { code: 402, message: 'Insufficient credits' } } },
    ]);
    const seats = createAiSeats({ seats: [{ agentId: 'a01', model: MODELS[1] }], transport: 'openrouter', keyFile, maxCost: 3, go: 'go', fetch: stub, url: FAKE_URL });
    const r1 = (await seats.decide([{ agentId: 'a01', view: v }])).get('a01');
    assert.equal(r1.ok, true, r1.why);
    assert.equal(r1.tries, 2);
    assert.equal(r1.reply.move, 'rest');
    const r2 = (await seats.decide([{ agentId: 'a01', view: v }])).get('a01');
    assert.deepEqual([r2.ok, r2.why, r2.tries], [false, 'http 400: bad field', 1]);
    const r3 = (await seats.decide([{ agentId: 'a01', view: v }])).get('a01');
    assert.deepEqual([r3.ok, r3.why, r3.tries], [false, 'halted: credit', 1]);
    const r4 = (await seats.decide([{ agentId: 'a01', view: v }])).get('a01');
    assert.deepEqual([r4.ok, r4.why, r4.tries], [false, 'halted: credit', 0]);
    assert.equal(seats.capped, false);
    assert.equal(seats.halted.kind, 'credit');
    assert.equal(stub.seen.length, 4);
    for (const s of stub.seen) {
      assert.equal(s.headers.get('authorization'), `Bearer ${word}`);
      assert.ok(!s.body.includes(word));
      assert.equal(s.headers.get('x-seat'), 'a01');
    }
    assert.deepEqual(stub.seen.map(s => s.headers.get('x-call')), ['1', '2', '3', '4']);
    assert.ok(!JSON.stringify(seats.log).includes(word));
  } finally {
    cleanup();
  }
});

test('preflight: OpenRouter balance and key limit against maxCost; the fake has none', async () => {
  const { dir, cleanup } = tempDir();
  try {
    const answers = () => [
      { status: 200, body: { data: { total_credits: 10, total_usage: 2 } } },
      { status: 200, body: { data: { limit_remaining: 5, usage: 1.5 } } },
    ];
    const keyFile = fakeKeyFile(dir);
    const seats = createAiSeats({ seats: [{ agentId: 'a01', model: MODELS[0] }], transport: 'openrouter', keyFile, maxCost: 3, go: 'go', fetch: stubFetch(answers()) });
    assert.deepEqual(await seats.preflight(), { balance: 8, left: 5, usage: 1.5, refused: null });
    const stub = stubFetch(answers());
    const tight = createAiSeats({ seats: [{ agentId: 'a01', model: MODELS[0] }], transport: 'openrouter', keyFile, maxCost: 6, go: 'go', fetch: stub });
    const p = await tight.preflight();
    assert.match(p.refused, /key's limit left, \$5\.00, is below --max-cost \$6/);
    assert.deepEqual(stub.seen.map(s => [s.method, new URL(s.url).pathname]), [['GET', '/api/v1/credits'], ['GET', '/api/v1/key']]);
  } finally {
    cleanup();
  }
  const fake = createAiSeats({ seats: [{ agentId: 'a01', model: MODELS[0] }], transport: 'fake' });
  assert.deepEqual(await fake.preflight(), { balance: null, left: null, usage: null, refused: null, transport: 'fake' });
  await fake.close();
});

test('estimate uses the per-call cost seen so far, per model', async () => {
  const { dir, cleanup } = tempDir();
  try {
    const v = loadFixture('zero-energy');
    const stub = stubFetch([
      { body: completion(okReply('rest'), { cost: 0.002 }) },
      { body: completion(okReply('rest'), { cost: 0.004 }) },
    ]);
    const seats = createAiSeats({
      seats: [{ agentId: 'a01', model: MODELS[0] }, { agentId: 'a02', model: MODELS[1] }, { agentId: 'a03', model: MODELS[2] }],
      transport: 'openrouter', keyFile: fakeKeyFile(dir), maxCost: 3, go: 'go', fetch: stub, url: FAKE_URL, concurrency: 1,
    });
    assert.equal(seats.estimate({ callsPerSeat: 54 }), null);
    const out = await seats.decide([{ agentId: 'a01', view: v }, { agentId: 'a02', view: v }]);
    assert.deepEqual(out.get('a01').usage, { in: 1000, out: 50, reasoning: null, cost: 0.002 });
    // a03's model has no call yet, so it takes the mean of the others: 0.003.
    const want = 54 * (0.002 + 0.004 + 0.003);
    assert.ok(Math.abs(seats.estimate({ callsPerSeat: 54 }) - want) < 1e-9);
    assert.throws(() => seats.estimate({}), /callsPerSeat/);
  } finally {
    cleanup();
  }
});

test('decide: results keyed by agent in sorted order; an unknown seat fails; a duplicate throws', async () => {
  const v = loadFixture('zero-energy');
  const seats = createAiSeats({ seats: [{ agentId: 'a02', model: MODELS[0] }, { agentId: 'a01', model: MODELS[0] }], transport: 'fake' });
  const out = await seats.decide([{ agentId: 'a02', view: v }, { agentId: 'a09', view: v }, { agentId: 'a01', view: v }]);
  assert.deepEqual([...out.keys()], ['a01', 'a02', 'a09']);
  assert.deepEqual([out.get('a09').ok, out.get('a09').why], [false, 'a09 is not an AI seat']);
  await assert.rejects(seats.decide([{ agentId: 'a01', view: v }, { agentId: 'a01', view: v }]), /twice/);
  assert.deepEqual(await seats.decide([]), new Map());
  await seats.close();
});
