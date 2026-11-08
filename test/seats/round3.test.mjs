// Round 3 (SPEC §0.1 R3.4-R3.6) on the AI seats: alerts first, style in place of slider numbers, clock times in place of
// the hour counter, the sentence cut, Claude limits by effort and the cut-off fallback, OpenRouter's 2000, and the
// --seat-models sliders and persona. Fakes only: no network, no key.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { render } from '../../src/seats/prompt.mjs';
import { parseReply, clipText } from '../../src/seats/reply.mjs';
import { dayClock } from '../../src/seats/clock.mjs';
import { createAiSeats, seatSettings, effortBelow } from '../../src/seats/ai.mjs';
import { SEAT_DEFAULTS, LIMITS } from '../../src/seats/defaults.mjs';
import { priceOf } from '../../src/seats/anthropic.mjs';
import { FAKE_THINKING } from '../../src/seats/fake-messages.mjs';
import { manualClock } from '../../src/seats/fake-model.mjs';
import { parseSeatModels, main } from '../../src/cli.mjs';
import { loadLineup, withAiSeats, twinOf } from '../../src/lineups.mjs';
import { createSeason } from '../../src/state.mjs';
import { defaultConfig } from '../../src/config.mjs';
import { buildBrief } from '../../src/view.mjs';
import { loadFixture, fixtureNames, atHour, tempDir, drive } from './helpers.mjs';

const SONNET = 'claude-sonnet-5-5';
const HAIKU = 'claude-haiku-5-5';
const GPT = 'openai/gpt-6.1-sol';
const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
const words = (n, w = 'word') => Array.from({ length: n }, (_, i) => `${w}${i + 1}`).join(' ');
const reply = over => JSON.stringify({ move: 'rest', target: null, args: null, thought: 'ok', say: '', message: null, sell: null, callShot: null, ...over });

// Every t-valued field of a view outside the brief, the menu and the clock (whose `hour` is the hour of day).
const HOUR_KEYS = ['hour', 'by', 'made', 'until', 'untilHour'];
function hoursIn(x, out = []) {
  if (Array.isArray(x)) for (const y of x) hoursIn(y, out);
  else if (isObject(x)) for (const [k, v] of Object.entries(x)) (HOUR_KEYS.includes(k) && Number.isInteger(v) ? out.push(v) : hoursIn(v, out));
  return out;
}
// Ways the old prompt showed the hour counter: "Hour t = 26", "hour 22", "until hour 33", "untilHour 33", "by 30"
// ("served last hour 5" is a count, not an hour).
const BARE_T = /\bt\s*=|\bhour t\b|(?<!last )\bhour \d+\b|\buntil hour\b|\buntilHour\b|\bmade \d+\b|\bby \d+\b|\bhours? "?t"?\b/i;

test('ALERTS come first in the user part; an empty or missing list says none', () => {
  const { user } = render(loadFixture('free-dealer'));
  assert.ok(user.startsWith('ALERTS (done to you last hour)\n- Kim (a07) mugged you for $60 on the corner.\n- Moss (a09) called you out'), user.slice(0, 200));
  assert.ok(user.indexOf('ALERTS') < user.indexOf('\nNOW\n'));
  assert.ok(render(loadFixture('zero-energy')).user.startsWith('ALERTS (done to you last hour)\nnone\n\nNOW\n'));
  const old = loadFixture('zero-energy');
  delete old.alerts;
  assert.ok(render(old).user.startsWith('ALERTS (done to you last hour)\nnone\n\nNOW\n'));
});

test('the style replaces the slider numbers: labels and levels, what the crowd pays, deals', () => {
  const { user } = render(loadFixture('armed-gunrunner'));
  assert.doesNotMatch(user, /Owner sliders|sliders|\brisk 0\.|\bclout 0\.|\bloyalty 0\./);
  assert.match(user, /^Style \(your owner's setting\): reckless, show-off, snake \(risk high, clout high, loyalty low\)\.$/m);
  assert.match(user, /^Your crowd pays more for risk moves \(pickpocket, mug, steal_car, bank_job, fistfight, crate, shoot, drive_by, kill_king, run_cops\) ×1\.4, for clout moves \(drip_check, party, battle, call_out, crip_walk\) ×1\.2 and for breaking a promise ×1\.3, and less for keeping a promise ×0\.7\. The MENU's fans already include this\.$/m);
  assert.match(user, /^Deals: Lux \(a04\) trusts you: sent you \$20 at Day 3 20:00\. Tess \(a06\) trusts you: promised you \$40 by Day 3 23:00\.$/m);
  // The style sits in YOU, right under the persona.
  assert.match(user, /^YOU\nOzzie \(a08\), gunrunner\. Persona: [^\n]+\nStyle \(your owner's setting\)/m);
  // Mostly less: a lowkey agent, mid on the rest.
  assert.match(render(loadFixture('zero-energy')).user, /^Your crowd pays more for keeping a promise ×1\.1, and less for clout moves \(drip_check, party, battle, call_out, crip_walk\) ×0\.6 and for breaking a promise ×0\.9\. The MENU's fans already include this\.$/m);
  // All mid: no labels, no multipliers.
  const mid = loadFixture('free-dealer');
  mid.you.style = { levels: { risk: 'mid', clout: 'mid', loyalty: 'mid' }, labels: [], pays: [], deals: [] };
  const m = render(mid).user;
  assert.match(m, /^Style \(your owner's setting\): no strong lean \(risk mid, clout mid, loyalty mid\)\.\nYour crowd pays the usual rate for every move\.\nAt corner\./m);
  assert.doesNotMatch(m, /Deals:/);
  // An old view without a style says so, and still shows no slider numbers.
  const old = loadFixture('free-dealer');
  delete old.you.style;
  const o = render(old).user;
  assert.match(o, /^Style \(your owner's setting\): none given\.$/m);
  assert.doesNotMatch(o, /sliders|risk 0\.8/);
});

test('no hour counter anywhere: every t-valued field prints as a clock time, in every fixture at several hours', () => {
  for (const name of fixtureNames()) {
    const base = loadFixture(name);
    for (const view of [base, atHour(base, 1, 6), atHour(base, 2, 14), atHour(base, 3, 23)]) {
      const { system, user } = render(view);
      const label = `${name} at Day ${view.clock.day} ${view.clock.hour}`;
      assert.doesNotMatch(user, BARE_T, label);
      assert.doesNotMatch(system, BARE_T, label);
      const clock = dayClock(view.clock);
      for (const t of hoursIn({ ...view, brief: null, menu: null, clock: null })) assert.ok(user.includes(clock.label(t)) || user.includes(clock.through(t)), `${label}: t=${t} as ${clock.label(t)}`);
    }
  }
  // The jail fixture's release is past the season's end: never a day 4.
  const jail = render(loadFixture('jail-talk-only')).user;
  assert.match(jail, /State: jail until the season's end\./);
  assert.doesNotMatch(jail, /Day 4/);
});

test("the engine's brief carries no hour counter either", { skip: /"t"/.test(buildBrief(defaultConfig()).rules.join('\n')) ? 'src/view.mjs buildBrief still has the rule \'Hours "t" count acting hours\' (builder A)' : false }, () => {
  const brief = buildBrief(defaultConfig());
  const { system } = render({ ...loadFixture('free-dealer'), brief });
  assert.doesNotMatch(system, BARE_T);
});

test('the clock: labels and "by" both ways, with the engine\'s mapping and an anchored one', () => {
  const c = dayClock({ day: 2, hour: 14, t: 26, actingHoursLeft: 28 });
  assert.deepEqual([c.per, c.first, c.end], [18, 6, 54]);
  assert.deepEqual([0, 17, 18, 26, 53].map(c.label), ['Day 1 06:00', 'Day 1 23:00', 'Day 2 06:00', 'Day 2 14:00', 'Day 3 23:00']);
  assert.equal(c.label(54), "the season's end");
  assert.deepEqual([c.through(33), c.through(56)], ['through Day 2 21:00', "until the season's end"]);
  for (let t = 0; t < 54; t++) assert.deepEqual(c.parse(c.label(t)), { t }, String(t));
  // Forgiving about case and spacing; a bare t (number or digits) still works.
  for (const s of ['Day 2 14:00', 'day 2 14:00', ' DAY 2, 14:00 ', 'day2 14', 'Day 2 at 14:00', 'Day 2 14 : 00']) assert.deepEqual(c.parse(s), { t: 26 }, s);
  assert.deepEqual([c.parse(26), c.parse('26'), c.parse(0)], [{ t: 26 }, { t: 26 }, { t: 0 }]);
  const why = by => c.parse(by).why;
  assert.match(why('tomorrow'), /"by" "tomorrow" is not a clock time like "Day 3 09:00"/);
  assert.match(why('Day 2 03:00'), /not an acting hour \(06:00-23:00\)/);
  assert.match(why('Day 2 14:30'), /not on the hour/);
  assert.match(why('Day 0 10:00'), /days start at Day 1/);
  for (const bad of [-1, 2.5, {}, [], true]) assert.ok(why(bad), JSON.stringify(bad));
  assert.match(why(null), /"by" is missing/);
  // A view with another day shape (hoursPerDay 12): the first hour is read off the view's own clock.
  const short = dayClock({ day: 2, hour: 9, t: 12, actingHoursLeft: 24, hoursPerDay: 12 });
  assert.deepEqual([short.per, short.first, short.label(12), short.label(23)], [12, 9, 'Day 2 09:00', 'Day 2 20:00']);
  assert.deepEqual(short.parse('Day 3 10:00'), { t: 25 });
  assert.match(short.parse('Day 3 21:00').why, /09:00-20:00/);
});

test('a promise "by" in the reply: a clock time becomes t, a bare t still works, anything else is dropped with its reason', () => {
  const dealer = loadFixture('free-dealer');
  const ctx = { self: 'a03', roster: dealer.roster, t: dealer.clock.t, clock: dealer.clock };
  const promise = by => parseReply(reply({ message: { to: 'a02', text: 'deal', promise: { give: { cash: 20 }, by } } }), dealer.menu, ctx);
  assert.deepEqual(promise('Day 2 18:00').reply.message.promise, { give: { cash: 20 }, by: 30 });
  assert.deepEqual(promise('day 3 9:00').reply.message.promise, { give: { cash: 20 }, by: 39 });
  assert.deepEqual(promise(30).reply.message.promise, { give: { cash: 20 }, by: 30 });
  const soon = promise('Day 2 15:00');
  assert.equal(soon.ok, true);
  assert.equal(soon.reply.message.promise, null);
  assert.equal(soon.reply.message.text, 'deal');
  assert.deepEqual(soon.dropped, [{ field: 'message.promise', why: '"by" Day 2 15:00 is too soon: at least Day 2 16:00' }]);
  for (const [by, why] of [['whenever', /"by" "whenever" is not a clock time/], ['Day 2 02:00', /not an acting hour/], [undefined, /"by" is missing/]]) {
    const r = promise(by);
    assert.equal(r.ok, true);
    assert.equal(r.reply.message.promise, null, String(by));
    assert.equal(r.dropped[0].field, 'message.promise');
    assert.match(r.dropped[0].why, why);
  }
  const noGive = parseReply(reply({ message: { to: 'a02', text: 'x', promise: { by: 'Day 2 18:00' } } }), dealer.menu, ctx);
  assert.match(noGive.dropped[0].why, /needs \{"give"/);
  // The reply format asks for a clock time and names no hour counter.
  const { system } = render(dealer);
  assert.match(system, /"by":"<Day N HH:00>"/);
  assert.match(system, /"by" is a clock time written as in NOW, e\.g\. "Day 3 09:00"/);
});

test('past a limit, text is cut at the last sentence end inside it, else at the word limit', () => {
  assert.equal(LIMITS.thought, 30);
  assert.equal(LIMITS.say, 20);
  // A sentence ends at word 12 and another at word 25; 35 words in all: the cut keeps 25.
  const thought = `${words(11)} end. ${words(12, 'more')} done! ${words(10, 'tail')}`;
  assert.deepEqual(clipText(thought, 30), { text: `${words(11)} end. ${words(12, 'more')} done!`, cut: true });
  // Closing quotes and brackets after the mark still end the sentence.
  assert.deepEqual(clipText('He said "go." then (we ran?) and kept going on and on', 6), { text: 'He said "go." then (we ran?)', cut: true });
  // No sentence end inside the limit: a word cut.
  assert.deepEqual(clipText(words(25), 20), { text: words(20), cut: true });
  // A sentence end past the limit doesn't count.
  assert.deepEqual(clipText(`${words(21)} late.`, 20), { text: words(20), cut: true });
  // Inside the limit: only whitespace is tidied.
  assert.deepEqual(clipText('  Short   one.  Two. ', 20), { text: 'Short one. Two.', cut: false });
  // Through parseReply: the cut is reported as before.
  const say = `I run this corner. Everybody knows it. ${words(20)}`;
  const r = parseReply(reply({ thought, say }), loadFixture('free-dealer').menu);
  assert.equal(r.reply.thought, `${words(11)} end. ${words(12, 'more')} done!`);
  assert.equal(r.reply.say, 'I run this corner. Everybody knows it.');
  assert.deepEqual(r.trimmed, ['thought', 'say']);
});

test('Claude seats: max_tokens and window by effort; the fallback order', () => {
  const at = effort => seatSettings({ agentId: 'a01', model: HAIKU, api: 'claude', effort });
  assert.deepEqual(['low', 'medium', 'high', 'xhigh', 'max'].map(e => [e, at(e).maxTokens, at(e).timeoutMs]), [
    ['low', 16000, 180000], ['medium', 16000, 180000], ['high', 16000, 180000], ['xhigh', 32000, 360000], ['max', 64000, 600000],
  ]);
  // A seat's own numbers still win.
  assert.deepEqual([seatSettings({ agentId: 'a01', model: SONNET, api: 'claude', effort: 'max', maxTokens: 20000, timeoutMs: 90000 }).maxTokens, seatSettings({ agentId: 'a01', model: SONNET, api: 'claude', effort: 'max', maxTokens: 20000, timeoutMs: 90000 }).timeoutMs], [20000, 90000]);
  assert.deepEqual(['max', 'xhigh', 'high', 'medium', 'low'].map(effortBelow), ['xhigh', 'high', 'medium', 'low', null]);
});

test('the cut-off fallback: retried once at the next lower effort, on the same tally, logged as a fallback', async () => {
  const v = loadFixture('free-dealer');
  const seats = createAiSeats({
    seats: [{ agentId: 'a03', model: HAIKU, api: 'claude', effort: 'xhigh' }], transport: 'fake',
    fakeClaude: { script: { a03: [{ fault: 'cutoff' }, { bot: true }] } },
  });
  const r = (await seats.decide([{ agentId: 'a03', view: v }])).get('a03');
  assert.equal(r.ok, true, r.why);
  assert.equal(r.finish, 'stop');
  assert.equal(r.tries, 2);
  assert.deepEqual(r.fallback, { from: 'xhigh', to: 'high', ok: true });
  assert.equal(r.effort, 'xhigh');
  // Two requests: the first at xhigh with 32000, the fallback at high with 16000.
  const calls = seats.fakeClaude.calls;
  assert.deepEqual(calls.map(c => [c.request.output_config.effort, c.request.max_tokens, c.reply.stop_reason]), [['xhigh', 32000, 'max_tokens'], ['high', 16000, 'end_turn']]);
  // Both calls are paid for, on the one tally, and the turn's usage holds both.
  const paid = calls.map(c => priceOf(HAIKU, c.reply.usage));
  assert.equal(seats.spend.calls, 2);
  assert.ok(Math.abs(seats.spend.cost - (paid[0] + paid[1])) < 1e-12);
  assert.ok(Math.abs(r.usage.cost - (paid[0] + paid[1])) < 1e-12);
  assert.equal(r.usage.reasoning, FAKE_THINKING.xhigh + FAKE_THINKING.high);
  const pm = seats.perModel[HAIKU];
  assert.deepEqual([pm.calls, pm.cutoffs, pm.fallbacks, pm.rescued, pm.failed], [2, 1, 1, 1, 0]);
  // The call log marks the fallback's call; the turn record says how it went.
  assert.deepEqual(seats.log.map(l => [l.call, l.finish, l.fallback ?? null]), [[1, 'max_tokens', null], [2, 'end_turn', { from: 'xhigh', to: 'high' }]]);
  assert.deepEqual(seats.turns[0].fallback, { from: 'xhigh', to: 'high', ok: true });
  await seats.close();
});

test('the fallback uses its effort\'s window; cut off again, or at low, or after the cap, the turn fails as before', async () => {
  const v = loadFixture('zero-energy');
  // max -> xhigh: the fallback's window is xhigh's 360 s, with the usual one transport retry.
  const clock = manualClock();
  const slow = createAiSeats({
    seats: [{ agentId: 'a01', model: SONNET, api: 'claude', effort: 'max' }], transport: 'fake', clock,
    fakeClaude: { script: { a01: [{ fault: 'cutoff' }, { fault: 'hang' }, { fault: 'hang' }] } },
  });
  const s = (await drive(slow.decide([{ agentId: 'a01', view: v }]), clock, 10000, 200)).get('a01');
  assert.deepEqual([s.ok, s.why, s.tries, s.fallback], [false, 'timeout', 3, { from: 'max', to: 'xhigh', ok: false }]);
  assert.deepEqual(slow.fakeClaude.calls.map(c => [c.request.max_tokens, c.outcome, c.ms]), [[64000, 'reply', 0], [32000, 'none', 360000], [32000, 'none', 360000]]);
  assert.deepEqual([slow.perModel[SONNET].fallbacks, slow.perModel[SONNET].rescued, slow.perModel[SONNET].failed], [1, 0, 1]);
  await slow.close();

  // Cut off twice: one fallback only.
  const twice = createAiSeats({ seats: [{ agentId: 'a01', model: SONNET, api: 'claude', effort: 'high' }], transport: 'fake', fakeClaude: { script: { a01: [{ fault: 'cutoff' }, { fault: 'cutoff' }] } } });
  const t2 = (await twice.decide([{ agentId: 'a01', view: v }])).get('a01');
  assert.equal(t2.ok, false);
  assert.match(t2.why, /^cut off: /);
  assert.deepEqual(t2.fallback, { from: 'high', to: 'medium', ok: false });
  assert.equal(twice.fakeClaude.calls.length, 2);
  await twice.close();

  // At low there is nothing lower.
  const low = createAiSeats({ seats: [{ agentId: 'a01', model: SONNET, api: 'claude', effort: 'low' }], transport: 'fake', fakeClaude: { script: { a01: [{ fault: 'cutoff' }] } } });
  const l = (await low.decide([{ agentId: 'a01', view: v }])).get('a01');
  assert.deepEqual([l.ok, l.fallback, low.fakeClaude.calls.length], [false, null, 1]);
  await low.close();

  // The first call crossed the cap: no fallback call (it would be over the cap).
  const capped = createAiSeats({ seats: [{ agentId: 'a01', model: SONNET, api: 'claude', effort: 'high' }], transport: 'fake', maxCost: 0.0001, fakeClaude: { script: { a01: [{ fault: 'cutoff' }] } } });
  const c = (await capped.decide([{ agentId: 'a01', view: v }])).get('a01');
  assert.deepEqual([c.ok, c.fallback, capped.fakeClaude.calls.length, capped.capped], [false, null, 1, true]);
  assert.match(c.why, /^cut off: /);
  await capped.close();

  // An OpenRouter seat's cut-off is not a Claude reply: no fallback.
  const chat = createAiSeats({ seats: [{ agentId: 'a01', model: GPT }], transport: 'fake', fake: { script: { a01: [{ fault: 'cutoff' }] } } });
  const o = (await chat.decide([{ agentId: 'a01', view: v }])).get('a01');
  assert.deepEqual([o.ok, o.finish, o.fallback, chat.fake.calls.length], [false, 'length', null, 1]);
  await chat.close();
});

test('OpenRouter seats ask for max_tokens 2000', async () => {
  assert.equal(SEAT_DEFAULTS.maxTokens, 2000);
  const seats = createAiSeats({ seats: [{ agentId: 'a01', model: GPT }, { agentId: 'a02', model: 'moonshotai/kimi-k3.1-pro' }], transport: 'fake' });
  await seats.decide([{ agentId: 'a01', view: loadFixture('zero-energy') }, { agentId: 'a02', view: loadFixture('zero-energy') }]);
  assert.deepEqual(seats.fake.calls.map(c => c.request.max_tokens), [2000, 2000]);
  await seats.close();
});

test('--seat-models sliders and persona: checked before any call', () => {
  const good = parseSeatModels(JSON.stringify([
    { model: SONNET, api: 'claude', effort: 'high', sliders: { loyalty: 0.05, risk: 0.95, clout: 0.5 }, persona: '  Charming, fearless, and lying to you right now. ' },
    { model: GPT, api: 'openrouter', sliders: { risk: 0, clout: 1, loyalty: 0.5 } },
    { model: HAIKU, api: 'claude' },
  ]));
  assert.deepEqual(good, [
    { model: SONNET, api: 'claude', effort: 'high', sliders: { risk: 0.95, clout: 0.5, loyalty: 0.05 }, persona: 'Charming, fearless, and lying to you right now.' },
    { model: GPT, api: 'openrouter', sliders: { risk: 0, clout: 1, loyalty: 0.5 } },
    { model: HAIKU, api: 'claude' },
  ]);
  const seat = extra => JSON.stringify([{ model: GPT, api: 'openrouter', ...extra }]);
  const bad = [
    [{ sliders: 0.5 }, /sliders is an object \{ risk, clout, loyalty \}/],
    [{ sliders: [0.1, 0.2, 0.3] }, /sliders is an object/],
    [{ sliders: null }, /sliders is an object/],
    [{ sliders: { risk: 0.5, clout: 0.5 } }, /needs all three of risk, clout, loyalty; missing loyalty/],
    [{ sliders: { risk: 0.5, clout: 0.5, loyalty: 0.5, flash: 0.5 } }, /sliders has unknown keys: flash/],
    [{ sliders: { risk: 1.2, clout: 0.5, loyalty: 0.5 } }, /sliders\.risk is a number from 0 to 1, not 1\.2/],
    [{ sliders: { risk: 0.5, clout: -0.1, loyalty: 0.5 } }, /sliders\.clout is a number from 0 to 1/],
    [{ sliders: { risk: 0.5, clout: 0.5, loyalty: '0.5' } }, /sliders\.loyalty is a number from 0 to 1, not "0\.5"/],
    [{ persona: '' }, /persona is a non-empty string of at most 120 characters/],
    [{ persona: '   ' }, /persona is a non-empty string/],
    [{ persona: 'x'.repeat(121) }, /at most 120 characters/],
    [{ persona: 7 }, /persona is a non-empty string/],
    [{ personality: 'loud' }, /unknown keys: personality \(it takes model, api, effort, sliders, persona\)/],
  ];
  for (const [extra, why] of bad) assert.throws(() => parseSeatModels(seat(extra)), why, JSON.stringify(extra));
  assert.doesNotThrow(() => parseSeatModels(seat({ persona: 'x'.repeat(120) })));
});

test('sliders and persona reach the seat with no jitter, and the bot twin keeps them', () => {
  const ai5 = loadLineup('ai5');
  const models = parseSeatModels(JSON.stringify([
    { model: SONNET, api: 'claude', sliders: { risk: 0.95, clout: 0.5, loyalty: 0.05 }, persona: 'Charming and lying.' },
    { model: GPT, api: 'openrouter' },
  ]));
  const lineup = withAiSeats(ai5, models);
  assert.deepEqual(lineup.seats[5], { brain: 'ai', twinBrain: 'greedy', model: SONNET, api: 'claude', sliders: { risk: 0.95, clout: 0.5, loyalty: 0.05 }, persona: 'Charming and lying.' });
  assert.deepEqual(lineup.seats[6], { brain: 'ai', twinBrain: 'greedy', model: GPT, api: 'openrouter' });
  const twin = twinOf(lineup);
  assert.deepEqual(twin.seats[5], { brain: 'greedy', sliders: { risk: 0.95, clout: 0.5, loyalty: 0.05 }, persona: 'Charming and lying.' });
  assert.deepEqual(twin.seats[6], { brain: 'greedy' });
  // Without sliders or persona the twin is the lineup itself.
  assert.deepEqual(twinOf(withAiSeats(ai5, [{ model: GPT, api: 'openrouter' }, 'x/y'])), ai5);
  // The season uses them exactly (no jitter), in the AI season and in its twin.
  const cfg = defaultConfig();
  for (const l of [lineup, twin]) {
    const a = createSeason({ seed: 1, config: cfg, lineup: l }).agents.a06;
    assert.deepEqual([a.sliders, a.persona], [{ risk: 0.95, clout: 0.5, loyalty: 0.05 }, 'Charming and lying.']);
  }
  const plain = createSeason({ seed: 1, config: cfg, lineup }).agents.a07;
  assert.notDeepEqual(plain.sliders, { risk: 0.5, clout: 0.5, loyalty: 0.5 }, 'a seat without sliders keeps its jittered preset');
});

test("the play-by-play's cast labels use the run's own style cut-offs (--set style.high/low)", async () => {
  const t = tempDir();
  try {
    const cast = async (name, sets) => {
      const out = path.join(t.dir, name);
      await main(['--bots', '--seeds', '1', ...sets.flatMap(s => ['--set', s]), '--out', out], { log: () => {} });
      const pbp = fs.readFileSync(path.join(out, '1', 'play-by-play.md'), 'utf8');
      return pbp.slice(pbp.indexOf('## Cast'), pbp.indexOf('\n\n', pbp.indexOf('## Cast') + 9));
    };
    // A cast line is "Name: brain · job", then " · labels" when the agent has any. The defaults label the hothead.
    assert.match(await cast('default', []), /^- \w+: hothead bot · \w+ · [^\n]*reckless/m);
    // With cut-offs no slider can reach, nobody is high or low, so no cast line has labels.
    const none = await cast('no-labels', ['style.high=2', 'style.low=-1']);
    const lines = none.split('\n').filter(l => l.startsWith('- '));
    assert.equal(lines.length, 10);
    for (const l of lines) assert.match(l, /^- [^·]+ · [^·]+$/, l);
  } finally {
    t.cleanup();
  }
});

test('a fake ai5 season with sliders and persona: run.json records them and the twin keeps them', async () => {
  const t = tempDir();
  try {
    const out = path.join(t.dir, 'r3');
    const SM = [
      { model: SONNET, api: 'claude', effort: 'high', sliders: { risk: 0.95, clout: 0.5, loyalty: 0.05 }, persona: 'Charming, fearless, and lying to you right now.' },
      { model: HAIKU, api: 'claude', effort: 'xhigh' },
      { model: GPT, api: 'openrouter' },
    ];
    const { runJson } = await main(['--ai', '--fake', '--seeds', '1', '--lineup', 'ai5', '--seat-models', JSON.stringify(SM), '--out', out, '--quiet']);
    assert.deepEqual(runJson.seatModels, SM);
    assert.deepEqual(runJson.seats[5].sliders, SM[0].sliders);
    assert.equal(runJson.seats[5].persona, SM[0].persona);
    const saved = JSON.parse(fs.readFileSync(path.join(out, 'run.json'), 'utf8'));
    assert.deepEqual(saved.ai.seatModels, SM);
    for (const dir of ['1', '1-twin']) {
      const a06 = JSON.parse(fs.readFileSync(path.join(out, dir, 'season.json'), 'utf8')).setup.agents.find(a => a.id === 'a06');
      assert.deepEqual([a06.sliders, a06.persona], [SM[0].sliders, SM[0].persona], dir);
    }
    const twin = JSON.parse(fs.readFileSync(path.join(out, '1-twin', 'season.json'), 'utf8')).setup.agents;
    assert.deepEqual(twin.slice(5).map(a => a.brain), ['greedy', 'greedy', 'greedy', 'greedy', 'greedy']);
  } finally {
    t.cleanup();
  }
});

test("the engine's talk cap is never below the AI parser's limits (a 15-word engine cap cut 244 of 246 AI thoughts)", async () => {
  const { defaultConfig } = await import('../../src/config.mjs');
  const { LIMITS } = await import('../../src/seats/defaults.mjs');
  const cfg = defaultConfig();
  assert.ok(cfg.talk.thoughtWords >= LIMITS.thought, `engine thought cap ${cfg.talk.thoughtWords} < parser ${LIMITS.thought}`);
  assert.ok(cfg.talk.sayWords >= LIMITS.say, `engine say cap ${cfg.talk.sayWords} < parser ${LIMITS.say}`);
});
