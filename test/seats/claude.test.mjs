// Claude seats (the Messages API through the copied ./anthropic.mjs) beside OpenRouter seats: fakes only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiSeats, seatSettings } from '../../src/seats/ai.mjs';
import { render } from '../../src/seats/prompt.mjs';
import { targetIds } from '../../src/seats/reply.mjs';
import { priceOf, CLAUDE_NOTE, CLAUDE_KEY_FILE } from '../../src/seats/anthropic.mjs';
import { fakeMessages, FAKE_THINKING } from '../../src/seats/fake-messages.mjs';
import { fakeModel, manualClock } from '../../src/seats/fake-model.mjs';
import { loadFixture, atHour, tempDir, fakeKeyFile, drive } from './helpers.mjs';

const SONNET = 'claude-sonnet-5-5';
const HAIKU = 'claude-haiku-5-5';
const GPT = 'openai/gpt-6.1-sol';
const okReply = move => JSON.stringify({ move, target: null, args: null, thought: 'test', say: '', message: null, sell: null, callShot: null });
const legalOn = (view, reply) => {
  const line = view.menu.find(m => m.id === reply.move);
  return !!line && (targetIds(line.targets).length === 0 || targetIds(line.targets).includes(reply.target));
};

test('the Messages-format fake round trip: a Messages body goes out, the reply comes back parsed and priced', async () => {
  const v = loadFixture('free-dealer');
  const seats = createAiSeats({ seats: [{ agentId: 'a03', model: SONNET, api: 'claude', effort: 'high' }], transport: 'fake' });
  const r1 = (await seats.decide([{ agentId: 'a03', view: v }])).get('a03');
  assert.equal(r1.ok, true, r1.why);
  assert.ok(legalOn(v, r1.reply), JSON.stringify(r1.reply));
  assert.equal(r1.api, 'claude');
  assert.equal(r1.effort, 'high');
  assert.equal(r1.finish, 'stop');
  assert.equal(r1.parsed, true);
  // The request as the Messages API takes it: top-level system with the cache mark, one user turn, adaptive thinking.
  const [c1] = seats.fakeClaude.calls;
  const { system, user } = render(v);
  assert.deepEqual(c1.request, {
    model: SONNET, max_tokens: 16000,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
    thinking: { type: 'adaptive' }, output_config: { effort: 'high' },
  });
  assert.equal(c1.version, '2023-06-01');
  assert.equal(c1.keyed, true);
  // The thinking block is stripped: the raw text is the reply's JSON alone.
  assert.ok(c1.reply.content.some(b => b.type === 'thinking'));
  assert.equal(r1.raw, c1.reply.content.find(b => b.type === 'text').text);
  assert.doesNotMatch(r1.raw, /fake reasoning/);
  // Usage: the whole prompt in, thinking inside out, priced from PRICES.
  const u1 = c1.reply.usage;
  assert.equal(r1.usage.in, u1.input_tokens + u1.cache_creation_input_tokens + u1.cache_read_input_tokens);
  assert.equal(r1.usage.out, u1.output_tokens);
  assert.equal(r1.usage.reasoning, FAKE_THINKING.high);
  assert.ok(Math.abs(r1.usage.cost - priceOf(SONNET, u1)) < 1e-12);
  assert.ok(u1.cache_creation_input_tokens > 0 && u1.cache_read_input_tokens === 0);
  // The next hour reads the cached system text, and costs less.
  const r2 = (await seats.decide([{ agentId: 'a03', view: atHour(v, 2, 15) }])).get('a03');
  const u2 = seats.fakeClaude.calls[1].reply.usage;
  assert.equal(u2.cache_creation_input_tokens, 0);
  assert.equal(u2.cache_read_input_tokens, u1.cache_creation_input_tokens);
  assert.ok(r2.usage.cost < r1.usage.cost);
  assert.equal(seats.spend.calls, 2);
  assert.ok(Math.abs(seats.spend.cost - (r1.usage.cost + r2.usage.cost)) < 1e-12);
  assert.equal(seats.fakeClaude.failures.length, 0);
  await seats.close();
});

test('effort, thinking, max_tokens and windows per seat: Claude seats think at their effort, OpenRouter seats stay minimal', async () => {
  const v = loadFixture('zero-energy');
  const seats = createAiSeats({
    seats: [
      { agentId: 'a01', model: SONNET, api: 'claude', effort: 'high' },
      { agentId: 'a02', model: HAIKU, api: 'claude', effort: 'xhigh' },
      { agentId: 'a03', model: SONNET, api: 'claude' },
      { agentId: 'a04', model: SONNET, api: 'claude', effort: 'max', maxTokens: 32000, timeoutMs: 300000 },
      { agentId: 'a05', model: GPT, api: 'openrouter' },
      { agentId: 'a06', model: 'anthropic/claude-haiku-5.5' },
    ],
    transport: 'fake',
  });
  assert.deepEqual(seats.seats.map(s => [s.agentId, s.api, s.effort, s.maxTokens, s.timeoutMs]), [
    ['a01', 'claude', 'high', 16000, 180000],
    ['a02', 'claude', 'xhigh', 32000, 360000],
    ['a03', 'claude', 'high', 16000, 180000],
    ['a04', 'claude', 'max', 32000, 300000],
    ['a05', 'openrouter', null, 2000, 60000],
    ['a06', 'openrouter', null, 2000, 60000],
  ]);
  const out = await seats.decide(['a01', 'a02', 'a03', 'a04', 'a05', 'a06'].map(agentId => ({ agentId, view: v })));
  for (const [id, r] of out) assert.equal(r.ok, true, `${id}: ${r.why}`);
  const claude = Object.fromEntries(seats.fakeClaude.calls.map(c => [c.seat, c.request]));
  assert.deepEqual([claude.a01.thinking, claude.a01.output_config, claude.a01.max_tokens], [{ type: 'adaptive' }, { effort: 'high' }, 16000]);
  assert.deepEqual([claude.a02.model, claude.a02.output_config, claude.a02.max_tokens], [HAIKU, { effort: 'xhigh' }, 32000]);
  assert.deepEqual(claude.a03.output_config, { effort: 'high' });
  assert.deepEqual([claude.a04.output_config, claude.a04.max_tokens], [{ effort: 'max' }, 32000]);
  assert.equal(out.get('a02').usage.reasoning, FAKE_THINKING.xhigh);
  const chat = Object.fromEntries(seats.fake.calls.map(c => [c.seat, c.request]));
  assert.deepEqual([chat.a05.reasoning, chat.a05.max_tokens, chat.a05.response_format], [{ effort: 'minimal' }, 2000, { type: 'json_object' }]);
  assert.deepEqual(chat.a06.reasoning, { enabled: false });
  assert.equal(seats.fakeClaude.calls.length, 4);
  assert.equal(seats.fake.calls.length, 2);
  assert.deepEqual(Object.keys(seats.perModel).sort(), [GPT, 'anthropic/claude-haiku-5.5', HAIKU, SONNET].sort());
  assert.deepEqual(seats.perModel[SONNET].efforts.sort(), ['high', 'max']);
  assert.equal(seats.perModel[SONNET].seats, 3);
  await seats.close();
});

test("a Claude seat's window is 180 s and an OpenRouter seat's 60 s; each gets one retry", async () => {
  const clock = manualClock();
  const v = loadFixture('zero-energy');
  const seats = createAiSeats({
    seats: [{ agentId: 'a01', model: SONNET, api: 'claude' }, { agentId: 'a02', model: GPT, api: 'openrouter' }],
    transport: 'fake', clock,
    fake: { script: { a02: [{ fault: 'hang' }, { fault: 'hang' }] } },
    fakeClaude: { script: { a01: [{ fault: 'hang' }, { fault: 'hang' }] } },
  });
  const out = await drive(seats.decide([{ agentId: 'a01', view: v }, { agentId: 'a02', view: v }]), clock, 10000, 100);
  assert.deepEqual([out.get('a01').why, out.get('a01').tries, out.get('a02').why, out.get('a02').tries], ['timeout', 2, 'timeout', 2]);
  assert.deepEqual(seats.fakeClaude.calls.map(c => [c.outcome, c.ms]), [['none', 180000], ['none', 180000]]);
  assert.deepEqual(seats.fake.calls.map(c => [c.outcome, c.ms]), [['none', 60000], ['none', 60000]]);
  assert.equal(out.get('a01').ms, 360000);
  assert.equal(seats.perModel[SONNET].failed, 1);
  await seats.close();
});

test('one cap counts both transports (fake run)', async () => {
  const v = loadFixture('free-dealer');
  const usage = { prompt_tokens: 1000, completion_tokens: 60, total_tokens: 1060, cost: 0.006 };
  const seats = createAiSeats({
    seats: [{ agentId: 'a01', model: GPT, api: 'openrouter' }, { agentId: 'a02', model: SONNET, api: 'claude', effort: 'high' }],
    transport: 'fake', maxCost: 0.015, concurrency: 1,
    fake: { script: { a01: [{ json: JSON.parse(okReply('rest')), usage }] } },
  });
  const hour1 = await seats.decide([{ agentId: 'a01', view: v }, { agentId: 'a02', view: v }]);
  assert.equal(hour1.get('a01').ok, true);
  // The Claude call (about a cent and a half on the fake's counts) crossed the cap; it was paid for, so it stands.
  assert.equal(hour1.get('a02').ok, true, hour1.get('a02').why);
  assert.ok(seats.spend.cost >= 0.015, String(seats.spend.cost));
  assert.equal(seats.capped, true);
  const hour2 = await seats.decide([{ agentId: 'a01', view: v }, { agentId: 'a02', view: v }]);
  assert.deepEqual([...hour2.values()].map(r => [r.ok, r.why, r.tries]), [[false, 'capped', 0], [false, 'capped', 0]]);
  assert.equal(seats.fake.calls.length, 1);
  assert.equal(seats.fakeClaude.calls.length, 1);
  assert.equal(seats.spend.calls, 2);
  await seats.close();
});

test('one cap counts both transports (live clients, injected fetch, temp keys): each API gets only its own key', async () => {
  const { dir, cleanup } = tempDir();
  try {
    const v = loadFixture('zero-energy');
    const chat = fakeModel({ script: { a01: [{ json: JSON.parse(okReply('rest')), usage: { prompt_tokens: 900, completion_tokens: 40, total_tokens: 940, cost: 0.004 } }] } });
    const msgs = fakeMessages({ script: { a02: [{ text: okReply('lay_low') }] } });
    const seen = [];
    const route = async (url, init) => {
      const h = new Headers(init.headers);
      seen.push({ path: new URL(String(url)).pathname, auth: h.get('authorization'), xkey: h.get('x-api-key'), body: init.body });
      return new URL(String(url)).pathname === '/v1/messages' ? msgs.fetch(url, init) : chat.fetch(url, init);
    };
    const orKey = fakeKeyFile(dir);
    const claudeKey = `${dir}/claude-key`;
    (await import('node:fs')).writeFileSync(claudeKey, ['claude', 'test', 'word'].join('-'));
    const halts = [];
    const seats = createAiSeats({
      seats: [{ agentId: 'a01', model: GPT, api: 'openrouter' }, { agentId: 'a02', model: SONNET, api: 'claude', effort: 'high' }],
      transport: 'live', maxCost: 0.01, go: 'test go words', keyFile: orKey, claudeKeyFile: claudeKey, fetch: route,
      url: 'http://fake.invalid/v1/chat/completions', claudeUrl: 'http://fake.invalid/v1/messages', concurrency: 1,
      onHalt: h => halts.push(h.kind),
    });
    const hour1 = await seats.decide([{ agentId: 'a01', view: v }, { agentId: 'a02', view: v }]);
    assert.equal(hour1.get('a01').ok, true, hour1.get('a01').why);
    assert.equal(hour1.get('a02').ok, true, hour1.get('a02').why);
    assert.equal(hour1.get('a02').reply.move, 'lay_low');
    assert.equal(seats.capped, true);
    assert.deepEqual(halts, ['cap']);
    const hour2 = await seats.decide([{ agentId: 'a01', view: v }, { agentId: 'a02', view: v }]);
    assert.deepEqual([...hour2.values()].map(r => r.why), ['capped', 'capped']);
    assert.equal(seen.length, 2, 'no request after the cap, on either API');
    assert.deepEqual(seen.map(s => s.path), ['/v1/chat/completions', '/v1/messages']);
    assert.equal(seen[0].auth, `Bearer ${['test', 'only', 'not', 'a', 'key'].join('-')}`);
    assert.equal(seen[0].xkey, null);
    assert.equal(seen[1].xkey, ['claude', 'test', 'word'].join('-'));
    assert.equal(seen[1].auth, null);
    for (const s of seen) assert.ok(!s.body.includes('test-only') && !s.body.includes('claude-test-word'));
    assert.ok(!JSON.stringify(seats.log).includes('claude-test-word'));
    await chat.close();
    await msgs.close();
  } finally {
    cleanup();
  }
});

test('Claude errors: a 529 waits and retries inside the client; a low-credit 400 and a 401 halt the run', async () => {
  const v = loadFixture('zero-energy');
  const clock = manualClock();
  const overloaded = { status: 529, error: { type: 'overloaded_error', message: 'Overloaded' } };
  const seats = createAiSeats({
    seats: [{ agentId: 'a01', model: HAIKU, api: 'claude', effort: 'xhigh' }], transport: 'fake', clock,
    fakeClaude: { script: { a01: [overloaded, { bot: true }, { status: 400, error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API.' } }] } },
  });
  const r1 = (await drive(seats.decide([{ agentId: 'a01', view: v }]), clock, 1000, 100)).get('a01');
  assert.equal(r1.ok, true, r1.why);
  assert.equal(r1.tries, 1, 'the 529 wait is the client\'s own, inside one try');
  assert.deepEqual(seats.fakeClaude.calls.map(c => [c.n, c.call, c.status]), [[1, 1, 529], [2, 1, 200]]);
  assert.equal(seats.fakeClaude.calls[1].start - seats.fakeClaude.calls[0].start, 6000);
  const r2 = (await seats.decide([{ agentId: 'a01', view: v }])).get('a01');
  assert.deepEqual([r2.ok, r2.why], [false, 'halted: credit']);
  assert.equal(seats.capped, false);
  assert.equal(seats.halted.kind, 'credit');
  const r3 = (await seats.decide([{ agentId: 'a01', view: v }])).get('a01');
  assert.deepEqual([r3.why, r3.tries], ['halted: credit', 0]);
  await seats.close();

  const keyless = createAiSeats({
    seats: [{ agentId: 'a01', model: SONNET, api: 'claude' }], transport: 'fake',
    fakeClaude: { script: { a01: [{ status: 401, error: { type: 'authentication_error', message: 'invalid x-api-key' } }] } },
  });
  const k = (await keyless.decide([{ agentId: 'a01', view: v }])).get('a01');
  assert.deepEqual([k.ok, k.why, keyless.halted.kind], [false, 'halted: key', 'key']);
  await keyless.close();
});

test('perModel: calls, tokens, reasoning, cost, failed, cut-offs, finishes, median and p90 latency', async () => {
  const clock = manualClock();
  const v = loadFixture('zero-energy');
  // Ten answers 1-10 s apart, then a cut-off. At effort low there is no lower effort to fall back to, so it fails.
  const script = { a01: [...Array.from({ length: 10 }, (_, i) => ({ bot: true, delayMs: (i + 1) * 1000 })), { fault: 'cutoff' }] };
  const seats = createAiSeats({ seats: [{ agentId: 'a01', model: SONNET, api: 'claude', effort: 'low' }], transport: 'fake', clock, fakeClaude: { script } });
  for (let h = 0; h < 11; h++) {
    const r = (await drive(seats.decide([{ agentId: 'a01', view: atHour(v, 1, 6 + h) }]), clock, 500, 100)).get('a01');
    if (h < 10) assert.equal(r.ok, true, r.why);
    else {
      assert.equal(r.ok, false);
      assert.equal(r.finish, 'length');
      assert.match(r.why, /^cut off: /);
    }
  }
  const pm = seats.perModel[SONNET];
  assert.equal(pm.calls, 11);
  assert.equal(pm.failed, 1);
  assert.equal(pm.cutoffs, 1);
  assert.deepEqual(pm.finishes, { end_turn: 10, max_tokens: 1 });
  assert.equal(pm.reasoning, 11 * FAKE_THINKING.low);
  assert.deepEqual([pm.fallbacks, pm.rescued], [0, 0]);
  assert.equal(pm.medianMs, 5000);
  assert.equal(pm.p90Ms, 9000);
  assert.ok(pm.in > 0 && pm.out > 0 && pm.cost > 0);
  assert.deepEqual(Object.keys(pm).sort(), ['api', 'calls', 'cost', 'cutoffs', 'efforts', 'failed', 'fallbacks', 'finishes', 'in', 'medianMs', 'out', 'p90Ms', 'reasoning', 'rescued', 'seats', 'skipped'].sort());
  const est = seats.estimateDetail({ callsPerSeat: 54 });
  assert.ok(Math.abs(est.total - (pm.cost / 11) * 54) < 1e-9);
  assert.deepEqual(Object.keys(est.perModel), [SONNET]);
  assert.equal(est.perModel[SONNET].measured, true);
  await seats.close();
});

test('live refusals: no maxCost or go; tests never reach the default Claude key; each key is read only when its API is used', () => {
  const claudeSeat = [{ agentId: 'a01', model: SONNET, api: 'claude' }];
  const stub = async () => {
    throw new Error('no network in tests');
  };
  assert.throws(() => createAiSeats({ seats: claudeSeat, transport: 'live', go: 'go', fetch: stub, claudeKeyFile: '/nonexistent-hkmini/k' }), /without maxCost/);
  assert.throws(() => createAiSeats({ seats: claudeSeat, transport: 'live', maxCost: 3, fetch: stub, claudeKeyFile: '/nonexistent-hkmini/k' }), /without go/);
  // The default Claude key file is refused under node --test before anything is read.
  assert.equal(typeof CLAUDE_KEY_FILE, 'string');
  assert.throws(() => createAiSeats({ seats: claudeSeat, transport: 'live', maxCost: 3, go: 'go', fetch: stub }), /under node --test/);
  // With both given, the Claude key file is read (this one doesn't exist).
  assert.throws(() => createAiSeats({ seats: claudeSeat, transport: 'live', maxCost: 3, go: 'go', fetch: stub, claudeKeyFile: '/nonexistent-hkmini/k' }), /ENOENT/);
  const { dir, cleanup } = tempDir();
  try {
    // OpenRouter-only: the Claude key file is never read (a missing one doesn't matter), and the reverse.
    assert.doesNotThrow(() => createAiSeats({ seats: [{ agentId: 'a01', model: GPT }], transport: 'live', maxCost: 3, go: 'go', fetch: stub, keyFile: fakeKeyFile(dir), claudeKeyFile: '/nonexistent-hkmini/k' }));
  } finally {
    cleanup();
  }
});

test('a Claude-only live run: OpenRouter key never read; preflight gives the Claude note and makes no call', async () => {
  const { dir, cleanup } = tempDir();
  try {
    const fsm = await import('node:fs');
    const claudeKey = `${dir}/claude-key`;
    fsm.writeFileSync(claudeKey, ['claude', 'test', 'word'].join('-'));
    let calls = 0;
    const stub = async () => {
      calls += 1;
      throw new Error('no network in tests');
    };
    const seats = createAiSeats({ seats: [{ agentId: 'a01', model: SONNET, api: 'claude' }], transport: 'live', maxCost: 3, go: 'go', fetch: stub, keyFile: '/nonexistent-hkmini/or', claudeKeyFile: claudeKey });
    assert.deepEqual(await seats.preflight(), { balance: null, left: null, usage: null, refused: null, claude: CLAUDE_NOTE });
    assert.equal(await seats.keyUsage(), null);
    assert.equal(calls, 0);
    assert.equal(seats.transport, 'live');
  } finally {
    cleanup();
  }
});

test('seat validation', () => {
  const s = over => seatSettings({ agentId: 'a01', model: SONNET, api: 'claude', ...over });
  assert.throws(() => s({ api: 'anthropic' }), /api is 'openrouter' or 'claude'/);
  assert.throws(() => s({ model: GPT, api: 'openrouter', effort: 'high' }), /effort is for claude seats/);
  assert.throws(() => s({ effort: 'extreme' }), /effort is one of low, medium, high, xhigh, max/);
  assert.throws(() => s({ model: 'claude-sonnet-9' }), /has no price/);
  assert.throws(() => s({ maxTokens: 0 }), /maxTokens is a whole number/);
  assert.deepEqual(s({}), { agentId: 'a01', model: SONNET, api: 'claude', effort: 'high', maxTokens: 16000, timeoutMs: 180000 });
  assert.deepEqual(seatSettings({ agentId: 'a02', model: GPT }), { agentId: 'a02', model: GPT, api: 'openrouter', effort: null, maxTokens: 2000, timeoutMs: 60000 });
});
