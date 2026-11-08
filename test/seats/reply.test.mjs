import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReply, extractJson, readSpec, checkArgs, clipWords } from '../../src/seats/reply.mjs';
import { loadFixture } from './helpers.mjs';

const dealer = loadFixture('free-dealer');
const gunner = loadFixture('armed-gunrunner');
const ctx = v => ({ self: v.you.id, roster: v.roster });
// A failed reply's verdict (a failed move also carries its talk: round 1).
const verdict = r => ({ ok: r.ok, why: r.why });
const words = n => Array.from({ length: n }, (_, i) => `w${i + 1}`).join(' ');
const reply = (over = {}) => JSON.stringify({
  move: 'deal', target: null, args: {}, thought: 'corner is crowded', say: '', message: null, sell: null, callShot: null, ...over,
});

test('a valid reply parses to the normalized §9.3 shape', () => {
  const r = parseReply(reply({ say: 'this is my corner', message: { to: 'a02', text: 'pay you tonight', cash: 0, item: null, promise: null } }), dealer.menu, ctx(dealer));
  assert.equal(r.ok, true, r.why);
  assert.deepEqual(r.reply, {
    move: 'deal', target: null, args: null, thought: 'corner is crowded', say: 'this is my corner',
    message: { to: 'a02', text: 'pay you tonight', cash: 0, item: null, promise: null }, sell: null, callShot: null,
  });
  assert.deepEqual(r.trimmed, []);
  assert.deepEqual(r.dropped, []);
});

test('a targeted move with args: target and args checked against the line', () => {
  const r = parseReply(reply({ move: 'mug', target: 'a07', args: { take: 'Chain' } }), dealer.menu, ctx(dealer));
  assert.equal(r.ok, true, r.why);
  assert.equal(r.reply.target, 'a07');
  assert.deepEqual(r.reply.args, { take: 'chain' });
  // An optional arg (null in the list) may be left out.
  const r2 = parseReply(reply({ move: 'mug', target: 'a05', args: {} }), dealer.menu, ctx(dealer));
  assert.equal(r2.ok, true, r2.why);
  assert.deepEqual(r2.reply.args, {});
  // By name, from the roster, or from target objects.
  assert.equal(parseReply(reply({ move: 'mug', target: 'kim', args: {} }), dealer.menu, ctx(dealer)).reply.target, 'a07');
  assert.equal(parseReply(reply({ move: 'kill_king', target: 'Rook', args: {} }), gunner.menu, ctx(gunner)).reply.target, 'a05');
  const buy = parseReply(reply({ move: 'buy', args: { item: 'product', qty: '3', from: 'board' } }), dealer.menu, ctx(dealer));
  assert.equal(buy.ok, true, buy.why);
  assert.deepEqual(buy.reply.args, { item: 'product', qty: 3, from: 'board' });
});

test('fenced JSON and stray text around the object are tolerated', () => {
  const body = reply({ move: 'rest' });
  for (const text of [
    '```json\n' + body + '\n```',
    '```\n' + body + '\n```',
    'Sure! Here is my move:\n' + body + '\nGood luck everyone.',
    '<think>I want {calm}</think>' + body,
    body.replace('"callShot":null}', '"callShot":null,}'),
  ]) {
    const r = parseReply(text, dealer.menu, ctx(dealer));
    assert.equal(r.ok, true, `${text}: ${r.why}`);
    assert.equal(r.reply.move, 'rest');
  }
});

test('malformed replies fail with a reason', () => {
  assert.deepEqual(parseReply('', dealer.menu), { ok: false, why: 'empty reply' });
  assert.deepEqual(parseReply(null, dealer.menu), { ok: false, why: 'empty reply' });
  assert.deepEqual(parseReply('{ this reply is not JSON }', dealer.menu), { ok: false, why: 'no JSON object in the reply' });
  assert.deepEqual(parseReply('I will deal.', dealer.menu), { ok: false, why: 'no JSON object in the reply' });
  // Cut off mid-object.
  assert.equal(parseReply('{"move":"deal","thought":"the corner is', dealer.menu).ok, false);
  assert.deepEqual(parseReply('[1,2]', dealer.menu), { ok: false, why: 'no JSON object in the reply' });
  assert.deepEqual(verdict(parseReply(reply({ move: undefined }), dealer.menu)), { ok: false, why: 'no move in the reply' });
});

test('a move that is not on the menu fails', () => {
  const r = parseReply(reply({ move: 'shoot', target: 'a07' }), dealer.menu, ctx(dealer));
  assert.equal(r.ok, false);
  assert.equal(r.why, 'move "shoot" is not on the menu');
  assert.equal(parseReply(reply({ move: 'DEAL' }), dealer.menu).reply.move, 'deal');
});

test('a wrong or missing target fails; a stray target on an untargeted move is dropped', () => {
  const wrong = parseReply(reply({ move: 'mug', target: 'a02', args: {} }), dealer.menu, ctx(dealer));
  assert.deepEqual(verdict(wrong), { ok: false, why: 'target "a02" is not a valid target for mug' });
  const missing = parseReply(reply({ move: 'mug', target: null, args: {} }), dealer.menu, ctx(dealer));
  assert.deepEqual(verdict(missing), { ok: false, why: 'mug needs a target: one of a05, a07' });
  const stray = parseReply(reply({ move: 'deal', target: 'a07' }), dealer.menu, ctx(dealer));
  assert.equal(stray.ok, true);
  assert.equal(stray.reply.target, null);
  assert.deepEqual(stray.dropped, [{ field: 'target', why: 'deal takes no target' }]);
});

test('bad args fail with the arg and its spec named', () => {
  const cases = [
    [{ move: 'move', args: { to: 'bank' } }, 'args.to "bank" is not one of "home", "bar", "docks"'],
    [{ move: 'buy', args: { item: 'product', qty: 9, from: 'board' } }, 'args.qty 9 is not a whole number from 1 to 5'],
    [{ move: 'buy', args: { item: 'product', qty: 1.5, from: 'board' } }, 'args.qty 1.5 is not a whole number from 1 to 5'],
    [{ move: 'buy', args: { item: 'product', qty: 'two', from: 'board' } }, 'args.qty "two" is not a whole number from 1 to 5'],
    [{ move: 'bounty', target: 'a05', args: { amount: 20 } }, 'args.amount 20 is not a whole number from 50 to 140'],
    [{ move: 'mug', target: 'a07', args: { take: 'gun' } }, 'args.take "gun" is not one of "cash", "chain", "car"'],
  ];
  for (const [over, why] of cases) assert.deepEqual(verdict(parseReply(reply(over), dealer.menu, ctx(dealer))), { ok: false, why }, JSON.stringify(over));
  // A missing required arg is filled from the line's first option, as the engine does (round 1).
  const firstTo = dealer.menu.find(l => l.id === 'move').options[0].args.to;
  for (const args of [{}, null]) {
    const filled = parseReply(reply({ move: 'move', args }), dealer.menu, ctx(dealer));
    assert.equal(filled.ok, true, filled.why);
    assert.deepEqual(filled.reply.args, { to: firstTo });
  }
  // A single-value list fills itself in; keys the spec lacks are dropped and named.
  const r = parseReply(reply({ move: 'buy', args: { item: 'chems', qty: 2, colour: 'red' } }), dealer.menu, ctx(dealer));
  assert.equal(r.ok, true, r.why);
  assert.deepEqual(r.reply.args, { item: 'chems', qty: 2, from: 'board' });
  assert.deepEqual(r.dropped, [{ field: 'args.colour', why: 'buy has no arg "colour"' }]);
  // Args on a move without a spec are dropped.
  const d = parseReply(reply({ move: 'rest', args: { hours: 2 } }), dealer.menu);
  assert.equal(d.ok, true);
  assert.equal(d.reply.args, null);
  assert.deepEqual(d.dropped, [{ field: 'args', why: 'rest takes no args' }]);
  // A spec the grammar can't read fails and names it.
  const menu = [{ id: 'buy', targets: null, args: { qty: 'between one and five' } }];
  assert.deepEqual(verdict(parseReply(reply({ move: 'buy', args: { qty: 2 } }), menu)), { ok: false, why: 'args spec for "qty" not understood: "between one and five"' });
});

test('the args spec grammar', () => {
  assert.deepEqual(readSpec(['gun', 'car']), { kind: 'enum', values: ['gun', 'car'], optional: false });
  assert.deepEqual(readSpec([null, 'chain']), { kind: 'enum', values: ['chain'], optional: true });
  assert.deepEqual(readSpec('int 1-5'), { kind: 'int', min: 1, max: 5, optional: false });
  assert.deepEqual(readSpec('int 50+'), { kind: 'int', min: 50, max: Infinity, optional: false });
  assert.deepEqual(readSpec('int >= 50'), { kind: 'int', min: 50, max: Infinity, optional: false });
  assert.deepEqual(readSpec('int $50-$140?'), { kind: 'int', min: 50, max: 140, optional: true });
  assert.deepEqual(readSpec('number 0.5-2'), { kind: 'num', min: 0.5, max: 2, optional: false });
  assert.equal(readSpec('lots'), null);
  assert.equal(readSpec([null]), null);
  assert.deepEqual(checkArgs({ amount: 'int 50+' }, { amount: '$75' }), { ok: true, args: { amount: 75 }, extra: [] });
  assert.deepEqual(checkArgs({ qty: 'int 1-3?' }, {}), { ok: true, args: {}, extra: [] });
});

test('over-long thought, say and message text are cut to their limits, and the cut is recorded', () => {
  // With no sentence end inside the limit, the cut falls back to words (round 3: thought 30, say 20).
  const r = parseReply(reply({
    thought: words(35), say: words(21), message: { to: 'a02', text: words(31) },
  }), dealer.menu, ctx(dealer));
  assert.equal(r.ok, true, r.why);
  assert.equal(r.reply.thought, words(30));
  assert.equal(r.reply.say, words(20));
  assert.equal(r.reply.message.text, words(30));
  assert.deepEqual(r.trimmed, ['thought', 'say', 'message.text']);
  // At the limit, nothing is cut.
  const ok = parseReply(reply({ thought: words(30), say: words(20) }), dealer.menu);
  assert.deepEqual(ok.trimmed, []);
  assert.deepEqual(clipWords('  a   b\n c ', 2), { text: 'a b', cut: true });
});

test('message checks: to must be another agent; bad attachments are dropped, the move kept', () => {
  const c = ctx(dealer);
  const bad = [
    [{ to: 'a99', text: 'hi' }, 'message'],
    [{ to: 'a03', text: 'note to self' }, 'message'],
    [{ text: 'no one' }, 'message'],
    ['hi', 'message'],
    [{ to: 'a02', text: '' }, 'message'],
  ];
  for (const [m, field] of bad) {
    const r = parseReply(reply({ message: m }), dealer.menu, c);
    assert.equal(r.ok, true);
    assert.equal(r.reply.message, null, JSON.stringify(m));
    assert.equal(r.dropped[0].field, field, JSON.stringify(m));
  }
  const byName = parseReply(reply({ message: { to: 'Penny', text: 'here', cash: '20', item: 'gun', promise: { give: { cash: 50 }, by: 40 } } }), dealer.menu, c);
  assert.deepEqual(byName.reply.message, { to: 'a02', text: 'here', cash: 20, item: 'gun', promise: { give: { cash: 50 }, by: 40 } });
  const parts = parseReply(reply({ message: { to: 'a02', text: 'here', cash: -5, promise: { give: { cash: 10, item: 'gun' }, by: 40 } } }), dealer.menu, c);
  assert.deepEqual(parts.reply.message, { to: 'a02', text: 'here', cash: 0, item: null, promise: null });
  assert.deepEqual(parts.dropped.map(d => d.field), ['message.cash', 'message.promise']);
  // Cash alone, with no text, is a gift and is kept.
  assert.deepEqual(parseReply(reply({ message: { to: 'a02', cash: 30 } }), dealer.menu, c).reply.message, { to: 'a02', text: '', cash: 30, item: null, promise: null });
  // With no roster in ctx, any other id shaped like a07 passes.
  assert.equal(parseReply(reply({ message: { to: 'a42', text: 'yo' } }), dealer.menu).reply.message.to, 'a42');
});

test('sell and callShot checks', () => {
  const c = ctx(dealer);
  assert.deepEqual(parseReply(reply({ sell: { good: 'product', qty: 2, price: 15 } }), dealer.menu, c).reply.sell, { good: 'product', qty: 2, price: 15 });
  assert.deepEqual(parseReply(reply({ sell: { good: 'gun', qty: 1, to: 'NPC' } }), dealer.menu, c).reply.sell, { good: 'guns', qty: 1, to: 'npc' });
  for (const s of [{ good: 'gold', qty: 1, price: 5 }, { good: 'chems', qty: 0, price: 5 }, { good: 'chems', qty: 1 }, { good: 'chems', qty: 1, price: 5, to: 'npc' }, 'all']) {
    const r = parseReply(reply({ sell: s }), dealer.menu, c);
    assert.equal(r.ok, true);
    assert.equal(r.reply.sell, null, JSON.stringify(s));
    assert.equal(r.dropped[0].field, 'sell');
  }
  assert.deepEqual(parseReply(reply({ callShot: { move: 'Mug', target: 'Kim' } }), dealer.menu, c).reply.callShot, { move: 'mug', target: 'a07' });
  for (const s of [{ move: 'dance', target: 'a07' }, { move: 'mug', target: 'a03' }, { move: 'mug' }, 'mug a07']) {
    const r = parseReply(reply({ callShot: s }), dealer.menu, c);
    assert.equal(r.reply.callShot, null, JSON.stringify(s));
    assert.equal(r.dropped[0].field, 'callShot');
  }
});

test('a talk-only view: move null is ok, a move given anyway is ignored, talk is kept', () => {
  const jail = loadFixture('jail-talk-only');
  const r = parseReply(reply({ move: null, say: 'I want my lawyer', message: { to: 'a04', text: 'sorry' } }), jail.menu, ctx(jail));
  assert.equal(r.ok, true, r.why);
  assert.equal(r.reply.move, null);
  assert.equal(r.reply.say, 'I want my lawyer');
  assert.equal(r.reply.message.to, 'a04');
  const moved = parseReply(reply({ move: 'rest' }), jail.menu, ctx(jail));
  assert.equal(moved.ok, true);
  assert.equal(moved.reply.move, null);
  assert.deepEqual(moved.dropped, [{ field: 'move', why: 'no menu this hour: the move is ignored' }]);
});

test('extractJson picks the first object that parses', () => {
  assert.deepEqual(extractJson('noise {"a":1} {"b":2}'), { a: 1 });
  assert.deepEqual(extractJson('{"a":"has } brace"}'), { a: 'has } brace' });
  assert.deepEqual(extractJson('{bad} {"a":{"b":1}}'), { a: { b: 1 } });
  assert.equal(extractJson('{"a":'), undefined);
});

test('a failed move keeps the reply\'s thought, say and message (round 1)', () => {
  const r = parseReply(reply({ move: 'teleport', thought: 'oops', say: 'watch this', message: { to: 'a02', text: 'meet me', cash: 0, item: null, promise: null } }), dealer.menu, ctx(dealer));
  assert.equal(r.ok, false);
  assert.equal(r.why, 'move "teleport" is not on the menu');
  assert.equal(r.reply.move, null);
  assert.equal(r.reply.thought, 'oops');
  assert.equal(r.reply.say, 'watch this');
  assert.deepEqual(r.reply.message, { to: 'a02', text: 'meet me', cash: 0, item: null, promise: null });
  assert.equal(r.reply.sell, null);
  assert.equal(r.reply.callShot, null);
});

test('buy takes only a listed item + source pair, and fills the source from it (round 1)', () => {
  const menu = [{ id: 'buy', targets: null, args: { item: ['chems', 'gun', 'car'], qty: 'int 1-5', from: ['board', 'shop', null] }, combos: [{ item: 'chems', from: 'board' }, { item: 'gun', from: 'shop' }, { item: 'car', from: 'shop' }], options: [{ args: { item: 'chems', qty: 2, from: 'board' } }] }];
  const ok = parseReply(reply({ move: 'buy', args: { item: 'car', qty: 1 } }), menu);
  assert.equal(ok.ok, true, ok.why);
  assert.deepEqual(ok.reply.args, { item: 'car', qty: 1, from: 'shop' });
  const bad = parseReply(reply({ move: 'buy', args: { item: 'car', qty: 1, from: 'board' } }), menu);
  assert.equal(bad.ok, false);
  assert.match(bad.why, /car from the board is not on sale/);
});

test('a promise due sooner than 2 hours from now is dropped (round 1)', () => {
  const c = { ...ctx(dealer), t: 26 };
  const soon = parseReply(reply({ message: { to: 'a02', text: 'soon', cash: 0, item: null, promise: { give: { cash: 20 }, by: 27 } } }), dealer.menu, c);
  assert.equal(soon.ok, true);
  assert.equal(soon.reply.message.promise, null);
  assert.equal(soon.dropped[0].field, 'message.promise');
  const later = parseReply(reply({ message: { to: 'a02', text: 'later', cash: 0, item: null, promise: { give: { cash: 20 }, by: 28 } } }), dealer.menu, c);
  assert.deepEqual(later.reply.message.promise, { give: { cash: 20 }, by: 28 });
});
